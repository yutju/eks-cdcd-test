#!/bin/bash
# 사용법: ./register-edge.sh <클러스터명>

CLUSTER_NAME=$1

if [ -z "$CLUSTER_NAME" ]; then
    echo "사용법: ./register-edge.sh <클러스터명>"
    exit 1
fi

echo "🚀 ArgoCD에 클러스터 등록 중: $CLUSTER_NAME"
# AWS 설정을 기반으로 컨텍스트를 찾아 ArgoCD에 등록
argocd cluster add $(kubectl config get-contexts -o name | grep "$CLUSTER_NAME") --name "$CLUSTER_NAME" --label edge=true

echo "✅ $CLUSTER_NAME 등록 완료."
