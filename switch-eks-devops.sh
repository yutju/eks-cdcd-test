#!/bin/bash
# EKS devops 클러스터로 컨텍스트 전환 스크립트

CONTEXT="arn:aws:eks:ap-northeast-2:278584440977:cluster/his-main-eks-devops"

echo "🚀 Switching to EKS devops cluster..."
kubectl config use-context "$CONTEXT"

if [ $? -eq 0 ]; then
    echo "✅ Switched successfully!"
    echo "Current context: $(kubectl config current-context)"
else
    echo "❌ Failed to switch context. Please check your kubeconfig."
fi
