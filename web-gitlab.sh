#!/bin/bash

# 설정 변수
GITLAB_IP="10.0.4.10"
KEY_FILE="his-bastion-key.pem"
BASTION_USER="ubuntu"
LOCAL_PORT=8080
REMOTE_PORT=80

# 1. IP 입력 확인
if [ -z "$1" ]; then
    read -p "배스천 호스트의 퍼블릭 IP를 입력하세요: " BASTION_IP
else
    BASTION_IP="$1"
fi

# 2. 실행 안내
echo "=================================================="
echo "GitLab 웹 접속 터널링을 시작합니다."
echo " - 연결 경로 : 로컬(8080) -> 배스천 -> 깃랩(80)"
echo " - 접속 주소 : http://localhost:8080"
echo "=================================================="

# 3. 기존 포트 정리 (실행 중인 터널 종료)
echo "기존 터널을 정리 중..."
fuser -k ${LOCAL_PORT}/tcp 2>/dev/null

# 4. SSH 포트 포워딩 실행 (백그라운드 모드)
# -f: 백그라운드 실행, -N: 명령 수행 안함, -L: 포트 포워딩
ssh -i "$KEY_FILE" -f -N -L ${LOCAL_PORT}:${GITLAB_IP}:${REMOTE_PORT} ${BASTION_USER}@${BASTION_IP}

if [ $? -eq 0 ]; then
    echo "성공: 터널이 열렸습니다."
    echo "이제 브라우저에서 http://localhost:8080 으로 접속하세요."
else
    echo "오류: 연결에 실패했습니다. 키 파일 경로와 보안 그룹을 확인하세요."
fi
