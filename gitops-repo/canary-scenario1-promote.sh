#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 카나리 시나리오 1 — 정상 승격
#   새 버전(기본 v2)을 카나리로 배포. 대시보드에서 v1 → v2 트래픽이
#   10% → 50% → 100%로 이동 후 stable로 교체되는 걸 시연.
# 사용법:
#   ./canary-scenario1-promote.sh          # v2로 배포
#   ./canary-scenario1-promote.sh v4       # 반복 시 버전만 바꿔서
# 위치 무관: scripts/ 안에서 실행해도 repo 루트를 자동으로 찾음.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ROLLOUT="$REPO_ROOT/kubernetes/apps/app-service-prod/rollout.yaml"
cd "$REPO_ROOT"
VER="${1:-v2}"

[ -f "$ROLLOUT" ] || { echo "❌ $ROLLOUT 없음 (gitops-repo가 맞는지 확인)"; exit 1; }

# 원격과 동기화 (로컬이 뒤처져 push 거부/구버전 커밋되는 것 방지)
git pull --rebase --autostash origin main >/dev/null 2>&1 || true

# env 블록이 없으면 컨테이너 ports: 앞에 1회 삽입
if ! grep -q "name: APP_VERSION" "$ROLLOUT"; then
  sed -i '0,/^        ports:/s//        env:\n        - name: APP_VERSION\n          value: "v1"\n        - name: FAIL_MODE\n          value: "false"\n        ports:/' "$ROLLOUT"
  echo "ℹ️  env 블록을 rollout.yaml에 삽입(최초 1회)."
fi

setenv(){ sed -i "/name: $1/{n;s/value: .*/value: \"$2\"/}" "$ROLLOUT"; }
setenv APP_VERSION "$VER"
setenv FAIL_MODE  "false"

git add "$ROLLOUT"
git commit -m "canary demo s1: 정상 승격 ($VER)"
git push origin main
kubectl patch application app-service-prod -n argocd --type merge \
  -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' >/dev/null

echo "✅ 시나리오1 시작 — $VER 카나리 배포"
echo "   관전: 대시보드  +  kubectl argo rollouts get rollout app-service -n web-apps --watch"

