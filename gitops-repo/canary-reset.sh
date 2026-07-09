#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 카나리 baseline 원복
#   APP_VERSION=v1, FAIL_MODE=false 로 되돌림. 시연 종료 후 정상 상태로.
# 사용법:
#   ./canary-reset.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ROLLOUT="$REPO_ROOT/kubernetes/apps/app-service-prod/rollout.yaml"
cd "$REPO_ROOT"

[ -f "$ROLLOUT" ] || { echo "❌ $ROLLOUT 없음 (gitops-repo가 맞는지 확인)"; exit 1; }

git pull --rebase --autostash origin main >/dev/null 2>&1 || true

if ! grep -q "name: APP_VERSION" "$ROLLOUT"; then
  echo "ℹ️  env 블록이 없어 원복할 것이 없습니다(이미 baseline)."; exit 0
fi

setenv(){ sed -i "/name: $1/{n;s/value: .*/value: \"$2\"/}" "$ROLLOUT"; }
setenv APP_VERSION "v1"
setenv FAIL_MODE  "false"

git add "$ROLLOUT"
git commit -m "canary demo reset: baseline v1"
git push origin main
kubectl patch application app-service-prod -n argocd --type merge \
  -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' >/dev/null

echo "✅ baseline(v1) 원복 완료"

