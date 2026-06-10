#!/bin/bash

# 1. 고정 설정값
KEY_FILE="his-bastion-key.pem"
BASTION_USER="ubuntu"
GITLAB_IP="10.0.4.10"
GITLAB_PORT="443"
LOCAL_PORT="8080"
DEFAULT_BASTION_IP="43.201.75.241"

# 2. Bastion IP 입력
echo "========================================"
read -p "Enter Bastion IP (Default: $DEFAULT_BASTION_IP): " INPUT_IP

BASTION_IP=${INPUT_IP:-$DEFAULT_BASTION_IP}

# 3. 안내 메시지
echo "========================================"
echo "Starting GitLab SSH tunneling."
echo " - Bastion IP : $BASTION_IP"
echo " - Access URL : http://localhost:$LOCAL_PORT"
echo " - Exit       : Ctrl + C"
echo "========================================"

# 4. 권한 설정
chmod 400 "$KEY_FILE" 2>/dev/null

# 5. SSH 포트 포워딩
ssh -i "$KEY_FILE" -N -L "$LOCAL_PORT:$GITLAB_IP:$GITLAB_PORT" "$BASTION_USER@$BASTION_IP"
