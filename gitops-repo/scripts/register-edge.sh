#!/bin/bash

# 고정된 클러스터 목록
CLUSTERS=("his-main-eks-devops" "his-main-eks-main" "his-main-eks-vdi-internal")

echo "🚀 ArgoCD 클러스터 일괄 등록 및 자동 라벨링을 시작합니다."
echo "--------------------------------------------------"

for CLUSTER_NAME in "${CLUSTERS[@]}"; do
    echo "⚙️  대상 클러스터: $CLUSTER_NAME"
    
    # 1. 클러스터 컨텍스트 이름 검색
    CONTEXT=$(kubectl config get-contexts -o name | grep "$CLUSTER_NAME")

    if [ -z "$CONTEXT" ]; then
        echo "❌ [에러] 컨텍스트를 찾을 수 없습니다: $CLUSTER_NAME (kubectl config get-contexts 확인 필요)"
        continue
    fi

    # 2. ArgoCD 클러스터 등록 및 업데이트
    echo "🚀 등록(또는 업데이트) 시도 중..."
    # 🌟 --upsert 옵션 추가: 기존에 등록된 클러스터 정보를 현재 kubeconfig로 덮어씀
    if argocd cluster add "$CONTEXT" --name "$CLUSTER_NAME" --upsert --yes; then
        echo "✅ $CLUSTER_NAME 등록/업데이트 완료."
        
        # 3. 라벨링 작업
        echo "🏷️  엣지 클러스터 라벨(edge=true) 부착 중..."
        # argocd.argoproj.io/cluster-name 라벨은 argocd cluster add 시 자동으로 생성되는 키입니다.
        kubectl label secret -n argocd -l argocd.argoproj.io/secret-type=cluster,argocd.argoproj.io/cluster-name="$CLUSTER_NAME" edge=true --overwrite
        echo "✅ $CLUSTER_NAME 라벨링 완료."
    else
        echo "❌ $CLUSTER_NAME 등록 실패. (권한 문제나 클러스터 접속 상태를 확인하세요.)"
    fi
    echo "--------------------------------------------------"
done

echo "🎉 모든 클러스터 등록 및 라벨링 프로세스가 종료되었습니다."
