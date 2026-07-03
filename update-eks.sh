#!/bin/bash

# 클러스터 목록
CLUSTERS=("his-main-eks-devops" "his-main-eks-vdi-internal" "his-main-eks-main")
REGION="ap-northeast-2"

echo "Start updating kubeconfig for ${#CLUSTERS[@]} clusters."
echo "--------------------------------------------------"

for CLUSTER_NAME in "${CLUSTERS[@]}"; do
  echo "Updating kubeconfig: $CLUSTER_NAME"
  
  # AWS 업데이트 명령어 실행
  aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"
  
  if [ $? -eq 0 ]; then
    echo "Successfully updated: $CLUSTER_NAME"
  else
    echo "Failed to update: $CLUSTER_NAME (Check VPN status)"
  fi
  echo "--------------------------------------------------"
done

echo "Update process finished."

