#!/bin/bash

# 클러스터 이름별 컨텍스트 매핑
DEV="arn:aws:eks:ap-northeast-2:278584440977:cluster/his-main-eks-devops"
MAIN="arn:aws:eks:ap-northeast-2:278584440977:cluster/his-main-eks-main"
VDI="arn:aws:eks:ap-northeast-2:278584440977:cluster/his-main-eks-vdi-internal"

case "$1" in
  dev)
    kubectl config use-context "$DEV"
    ;;
  main)
    kubectl config use-context "$MAIN"
    ;;
  vdi)
    kubectl config use-context "$VDI"
    ;;
  *)
    echo "Usage: ./switch-ctx.sh {dev|main|vdi}"
    exit 1
    ;;
esac
