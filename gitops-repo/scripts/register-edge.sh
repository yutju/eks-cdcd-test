#!/bin/bash

# 고정된 클러스터 목록
CLUSTERS=("his-main-eks-devops" "his-main-eks-main" "his-main-eks-vdi-internal")

echo "🚀 ArgoCD 클러스터 일괄 등록을 시작합니다."
echo "--------------------------------------------------"

for CLUSTER_NAME in "${CLUSTERS[@]}"; do
    echo "⚙️  대상 클러스터: $CLUSTER_NAME"
    
    # 1. 클러스터 컨텍스트 이름 검색
    CONTEXT=$(kubectl config get-contexts -o name | grep "$CLUSTER_NAME")

    if [ -z "$CONTEXT" ]; then
        echo "❌ [에러] 컨텍스트를 찾을 수 없습니다: $CLUSTER_NAME (kubectl config get-contexts 확인 필요)"
        continue
    fi

    # 2. ArgoCD 클러스터 등록
    echo "🚀 등록 시도 중..."
    if argocd cluster add "$CONTEXT" --name "$CLUSTER_NAME" --label edge=true --yes; then
        echo "✅ $CLUSTER_NAME 등록 완료."
    else
        echo "❌ $CLUSTER_NAME 등록 실패. (이미 등록되어 있거나 권한 문제일 수 있습니다.)"
    fi
    echo "--------------------------------------------------"
done

echo "🎉 모든 클러스터 등록 프로세스가 종료되었습니다."
