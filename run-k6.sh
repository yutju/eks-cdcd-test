#!/bin/bash
# k6 부하 테스트 실행 (현재 경로 기준)

echo "🚀 k6 부하 테스트를 시작합니다..."

# 1. ConfigMap 적용
kubectl apply -f ./k6/k6-configmap.yaml -n dev-apps

# 2. Job 실행 (이전 작업 있으면 삭제)
kubectl delete job k6-load-test -n dev-apps --ignore-not-found=true
kubectl apply -f ./k6/k6-job.yaml -n dev-apps

echo "✅ 테스트가 시작되었습니다!"
echo "실시간 결과 확인: kubectl logs -f job/k6-load-test -n dev-apps"
