#!/bin/bash
set -e

# 무인 실행(Terraform 등) 지원: ARGOCD_SERVER / ARGOCD_AUTH_TOKEN 환경변수가 있으면
# 'argocd login' 없이도 CLI가 자동으로 인증됨 (미리 'argocd account generate-token'으로 발급)
if [ -z "$ARGOCD_SERVER" ] || [ -z "$ARGOCD_AUTH_TOKEN" ]; then
    echo "ARGOCD_SERVER / ARGOCD_AUTH_TOKEN 이 설정되지 않았습니다."
    echo "    (수동 실행이라면 'argocd login'을 먼저 하셨는지 확인하세요.)"
fi

# 고정된 클러스터 목록 (his-main-eks-devops는 hub 역할이므로 제외)
CLUSTERS=("his-main-eks-main" "his-main-eks-vdi-internal")

# ArgoCD(및 edge-clusters-appset)가 실제로 떠있는 hub 클러스터의 context를 명시적으로 고정
# 현재 활성 context가 뭐든 상관없이 label/patch는 항상 hub를 향하도록 함
HUB_CONTEXT=$(kubectl config get-contexts -o name | grep "his-main-eks-devops")

if [ -z "$HUB_CONTEXT" ]; then
    echo "[ERROR] hub 클러스터(his-main-eks-devops) context를 찾을 수 없습니다."
    echo "    'aws eks update-kubeconfig --name his-main-eks-devops' 로 먼저 kubeconfig를 갱신하세요."
    exit 1
fi
echo "hub context 고정: $HUB_CONTEXT"

echo "ArgoCD 클러스터 일괄 등록 및 자동 라벨링을 시작합니다."
echo "--------------------------------------------------"

for CLUSTER_NAME in "${CLUSTERS[@]}"; do
    echo "대상 클러스터: $CLUSTER_NAME"

    # 1. 클러스터 컨텍스트 이름 검색
    CONTEXT=$(kubectl config get-contexts -o name | grep "$CLUSTER_NAME")

    if [ -z "$CONTEXT" ]; then
        echo "[ERROR] 컨텍스트를 찾을 수 없습니다: $CLUSTER_NAME (kubectl config get-contexts 확인 필요)"
        continue
    fi

    # 2. ArgoCD 클러스터 등록 및 업데이트
    echo "등록(또는 업데이트) 시도 중..."
    if argocd cluster add "$CONTEXT" --name "$CLUSTER_NAME" --upsert --yes; then
        echo "$CLUSTER_NAME 등록/업데이트 완료."

        # 3. 라벨링 작업
        echo "엣지 클러스터 라벨(edge=true) 부착 중..."
        kubectl --context "$HUB_CONTEXT" label secret -n argocd \
          -l argocd.argoproj.io/secret-type=cluster,argocd.argoproj.io/cluster-name="$CLUSTER_NAME" \
          edge=true --overwrite
        echo "$CLUSTER_NAME 라벨링 완료."
    else
        echo "$CLUSTER_NAME 등록 실패. (권한 문제나 클러스터 접속 상태를 확인하세요.)"
    fi
    echo "--------------------------------------------------"
done

echo "모든 클러스터 등록 및 라벨링 프로세스가 종료되었습니다."

# ArgoCD에 변경사항(라벨) 즉시 반영 트리거
echo "edge-clusters-appset 강제 새로고침 중..."
kubectl --context "$HUB_CONTEXT" patch applicationset edge-clusters-appset -n argocd \
  -p '{"metadata": {"annotations": {"argocd.argoproj.io/refresh": "hard"}}}' \
  --type=merge

echo "새로고침 완료!"
