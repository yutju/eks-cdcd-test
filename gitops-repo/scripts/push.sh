#!/bin/bash

# 1. 프로젝트 루트로 이동 (현재 스크립트가 scripts/ 폴더에 있으므로 한 단계 상위로 이동)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 사용자 정보 및 레포지토리 설정
USER_NAME="yutju"
REPO_NAME="jenkins-test"

echo "--------------------------------------------------"
echo "🚀 $REPO_NAME 프로젝트 Git Push 시작"
echo "📍 위치: $PROJECT_ROOT"
echo "--------------------------------------------------"

# 2. 토큰 입력 받기 (입력 시 보안을 위해 화면에 글자가 보이지 않음)
echo -n "🔑 GitHub Personal Access Token을 입력하세요: "
read -s GITHUB_TOKEN
echo "" # 줄바꿈

if [ -z "$GITHUB_TOKEN" ]; then
    echo "--------------------------------------------------"
    echo "❌ 토큰이 입력되지 않았습니다. 스크립트를 종료합니다."
    echo "--------------------------------------------------"
    exit 1
fi

# 토큰을 포함한 임시 원격 주소 구성
REMOTE_URL="https://${USER_NAME}:${GITHUB_TOKEN}@github.com/${USER_NAME}/${REPO_NAME}.git"

# 3. .gitignore 기반으로 변경사항 정리 및 스테이징
echo "🔍 1. Git 캐시 정리 및 변경사항 감지 중..."
git rm -r --cached . > /dev/null 2>&1
git add .

# 4. 커밋 메시지 처리 ($1 인자값이 없으면 기본 타임스탬프 사용)
COMMIT_MSG=$1
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S') 🎖️"
fi

echo "📝 2. 커밋 메시지: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 5. 현재 브랜치 확인 및 푸시 실행
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📤 3. GitHub로 전송 중 ('$CURRENT_BRANCH' 브랜치)..."

# 기존 origin 주소 대신 토큰이 포함된 URL로 직접 푸시
git push "$REMOTE_URL" "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo "--------------------------------------------------"
    echo "✅ 푸시 성공!"
    echo "--------------------------------------------------"
else
    echo "--------------------------------------------------"
    echo "❌ 푸시 실패! 토큰 권한이나 네트워크 상태를 확인하세요."
    echo "--------------------------------------------------"
fi

# 6. 메모리에서 토큰 변수 해제 (보안)
unset GITHUB_TOKEN
