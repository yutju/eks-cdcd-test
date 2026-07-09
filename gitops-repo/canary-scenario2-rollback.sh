#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 카나리 시나리오 2 — 불량 버전 자동 차단(롤백)
#   FAIL_MODE=true 로 요청 30%를 500으로 내는 버전(기본 v3)을 배포.
#   10% 트래픽 단계에서 성공률이 95% 밑으로 떨어져 카나리 분석이 Failed →
#   Rollouts가 즉시 abort하여 트래픽을 stable로 되돌림(피해는 10%에서 멈춤).
# 사용법:
#   ./canary-scenario2-rollback.sh         # v3(불량)로 배포
#   ./canary-scenario2-rollback.sh v5
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ROLLOUT="$REPO_ROOT/kubernetes/apps/app-service-prod/rollout.yaml"
cd "$REPO_ROOT"
VER="${1:-v3}"

[ -f "$ROLLOUT" ] || { echo "❌ $ROLLOUT 없음 (gitops-repo가 맞는지 확인)"; exit 1; }

git pull --rebase --autostash origin main >/dev/null 2>&1 || true

if ! grep -q "name: APP_VERSION" "$ROLLOUT"; then
  sed -i '0,/^        ports:/s//        env:\n        - name: APP_VERSION\n          value: "v1"\n        - name: FAIL_MODE\n          value: "false"\n        ports:/' "$ROLLOUT"
  echo "ℹ️  env 블록을 rollout.yaml에 삽입(최초 1회)."
fi

setenv(){ sed -i "/name: $1/{n;s/value: .*/value: \"$2\"/}" "$ROLLOUT"; }
setenv APP_VERSION "$VER"
setenv FAIL_MODE  "true"

git add "$ROLLOUT"
git commit -m "canary demo s2: 불량 자동차단 ($VER)"
git push origin main
kubectl patch application app-service-prod -n argocd --type merge \
  -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' >/dev/null

echo "✅ 시나리오2 시작 — $VER (요청 30% 5xx)"
echo "   기대: 대시보드에 5xx 등장 → 성공률 빨강 → 자동 abort → stable 복귀"
echo "   판정: kubectl get analysisrun -n web-apps   (마지막이 Failed)"

