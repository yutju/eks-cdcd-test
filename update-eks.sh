#!/bin/bash

# 클러스터 목록
CLUSTERS=(
  "his-main-eks-devops"
  "his-main-eks-vdi-internal"
  "his-main-eks-main"
)

REGION="ap-northeast-2"
PROXY="socks5://localhost:1000"

echo "Start updating kubeconfig for ${#CLUSTERS[@]} clusters."

for CLUSTER_NAME in "${CLUSTERS[@]}"; do
  echo "Updating kubeconfig: $CLUSTER_NAME"
  
  # 1. Kubeconfig 업데이트
  aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME" > /dev/null 2>&1

  # 2. 클러스터 ARN/Name 추출
  CLUSTER_ARN=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')

  # 3. 프록시 설정
  kubectl config set-cluster "$CLUSTER_ARN" --proxy-url="$PROXY" > /dev/null 2>&1

  echo "Completed: $CLUSTER_NAME"
done

echo "All cluster configurations are updated."
echo "Use 'kubectx' to switch targets and 'kubectl get nodes' to verify."
