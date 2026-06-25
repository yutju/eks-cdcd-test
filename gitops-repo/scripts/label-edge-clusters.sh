#!/bin/bash
# 엣지 클러스터 라벨 자동 부여 스크립트

# 타겟 클러스터 이름들
CLUSTERS=("his-main-eks-main" "his-main-eks-devops")

echo "🏷️ 엣지 클러스터 라벨링 시작..."

for NAME in "${CLUSTERS[@]}"; do
    # 1. 시크릿 이름이 계속 바뀌어도 'argocd.argoproj.io/secret-type=cluster' 
    #    그리고 해당 이름(name)을 가진 시크릿을 검색
    SECRET_NAME=$(kubectl get secret -n argocd \
        -l argocd.argoproj.io/secret-type=cluster \
        -o jsonpath="{.items[?(@.data.name=='$(echo -n $NAME | base64 -w0)')].metadata.name}")

    if [ -n "$SECRET_NAME" ]; then
        echo "✅ 찾음: 클러스터 '$NAME' -> 시크릿 '$SECRET_NAME'"
        kubectl label secret "$SECRET_NAME" -n argocd edge=true --overwrite
    else
        echo "⚠️ 경고: 클러스터 '$NAME'에 해당하는 시크릿을 찾을 수 없습니다."
    fi
done

# 2. ArgoCD에 변경사항 반영 트리거
kubectl patch applicationset edge-clusters-appset -n argocd \
  -p '{"metadata": {"annotations": {"argocd.argoproj.io/refresh": "hard"}}}' \
  --type=merge

echo "🎉 라벨링 및 새로고침 완료!"
