#!/bin/bash

# 1. 고정 설정값
KEY_FILE="his-bastion-key.pem"
BASTION_USER="ubuntu"
GITLAB_IP="10.0.4.10"
GITLAB_PORT="443"       # 깃랩에 HTTPS가 적용되어 있다면 443으로 변경하세요.
LOCAL_PORT="8080"      # 로컬 PC에서 접속할 포트 (http://localhost:8080)
DEFAULT_BASTION_IP="43.201.75.241"

# 2. Bastion IP 입력받기
echo "========================================"
read -p "Bastion IP를 입력하세요 (엔터 시 $DEFAULT_BASTION_IP 적용): " INPUT_IP

# 입력값이 비어있으면 기본값 사용, 있으면 입력값 사용
BASTION_IP=${INPUT_IP:-$DEFAULT_BASTION_IP}

# 3. 실행 안내 메시지 출력
echo "========================================"
echo "🚀 깃랩(GitLab) SSH 터널링을 시작합니다."
echo " - Bastion IP : $BASTION_IP"
echo " - 접속 주소  : http://localhost:$LOCAL_PORT"
echo " - 종료 방법  : Ctrl + C"
echo "========================================"

# 4. 키 파일 권한 확인 (필요시 권한 변경)
chmod 400 "$KEY_FILE" 2>/dev/null

# 5. SSH 포트 포워딩 실행
ssh -i "$KEY_FILE" -N -L "$LOCAL_PORT:$GITLAB_IP:$GITLAB_PORT" "$BASTION_USER@$BASTION_IP"
