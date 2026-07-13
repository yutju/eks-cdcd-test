#!/bin/bash
# ─────────────────────────────────────────────────────────────
# reconcile-ecr-image.sh
#   클러스터+ECR 재생성 직후 1회 실행 (bootstrap-argocd.sh 전에).
#   gitops-repo 가 고정(pin)한 이미지 태그를, 그 태그로 '실제 빌드'해서 빈 ECR에 push.
#   → ImagePullBackOff 방지 + APP_VERSION 일치(build-2 유령 방지).
#
#   ※ put-image 매니페스트 복사와의 차이:
#     --build-arg APP_VERSION=$TAG 로 '태그 = 박히는 버전'을 일치시킨다.
#   전제: docker + aws-cli 설치, aws 자격증명 설정, gitops-repo/app-repo 클론됨.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REGION="ap-northeast-2"
REPO="web-service/app-image"
GITOPS_ROLLOUT="$HOME/army6/gitops-repo/kubernetes/apps/app-service-prod/rollout.yaml"
APP_CONTEXT="$HOME/army6/app-repo/app-service"

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
ECR="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

# 1) gitops 가 고정한 태그 읽기 (예: build-7)
TAG="$(grep -oP 'app-image:\K[^"[:space:]]+' "$GITOPS_ROLLOUT" | head -1)"
if [ -z "$TAG" ]; then
  echo "ERROR: rollout.yaml 에서 이미지 태그를 못 찾음: $GITOPS_ROLLOUT"
  exit 1
fi
echo "gitops 고정 태그: $TAG"

# 2) ECR 로그인
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ECR"

# 3) 그 태그로 '실제' 빌드 (APP_VERSION 일치) → push
docker build -t "${ECR}/${REPO}:${TAG}" \
  --build-arg APP_VERSION="${TAG}" \
  "$APP_CONTEXT"
docker push "${ECR}/${REPO}:${TAG}"

echo "완료: ${ECR}/${REPO}:${TAG}  (APP_VERSION=${TAG})"
echo "이제 bootstrap-argocd.sh 를 실행하세요."
