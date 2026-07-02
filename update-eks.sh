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
echo "--------------------------------------------------"

# kubeconfig 갱신 직후 ArgoCD 클러스터 등록/라벨링/refresh까지 자동 실행
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REGISTER_SCRIPT="$SCRIPT_DIR/gitops-repo/scripts/register-edge.sh"

if [ -f "$REGISTER_SCRIPT" ]; then
    echo "🚀 ArgoCD 클러스터 재등록을 시작합니다..."
    bash "$REGISTER_SCRIPT"
else
    echo "⚠️  경고: register-edge.sh를 찾을 수 없습니다 ($REGISTER_SCRIPT). 수동으로 실행해주세요."
fi
