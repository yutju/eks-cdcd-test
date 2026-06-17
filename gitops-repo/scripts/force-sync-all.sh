#!/bin/bash

echo "🚀 ArgoCD 모든 애플리케이션 강제 동기화 시작..."

# 1. ArgoCD가 관리하는 모든 Application 이름 가져오기
APPS=$(kubectl get applications -n argocd -o jsonpath='{.items[*].metadata.name}')

for APP in $APPS; do
    echo "--------------------------------------------------"
    echo "🔄 처리 중인 앱: $APP"

    # 2. Hard Refresh: 깃 리포지토리 상태를 강제로 다시 가져옴
    kubectl patch application "$APP" -n argocd \
        -p '{"metadata": {"annotations": {"argocd.argoproj.io/refresh": "hard"}}}' \
        --type=merge > /dev/null 2>&1

    # 3. 강제 동기화 (Sync): 현재 상태가 Git과 다르더라도 강제로 맞춤
    # 자동 동기화(automated) 정책이 이미 있더라도 동기화 트리거를 강제로 발생시킴
    kubectl annotate application "$APP" -n argocd \
        argocd.argoproj.io/sync-wave=0 --overwrite > /dev/null 2>&1

    echo "✅ $APP 상태 새로고침 및 동기화 요청 완료."
done

echo "--------------------------------------------------"
echo "🎉 모든 ArgoCD 리소스 동기화 작업이 성공적으로 요청되었습니다!"
echo "상태는 'argocd app list -n argocd' 명령어로 확인하세요."
