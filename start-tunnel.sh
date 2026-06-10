#!/bin/bash

# 1. IP 입력 확인
if [ -z "$1" ]; then
    echo "Error: Bastion host IP is required."
    echo "Usage: ./start-tunnel.sh <BASTION_PUBLIC_IP>"
    echo "Example: ./start-tunnel.sh 43.200.169.142"
    exit 1
fi

# 2. 설정 변수
KEY_PATH="his-bastion-key.pem"
BASTION_USER="ubuntu"
BASTION_IP="$1"
PORT="1000"

echo "--------------------------------------------------"
echo "Starting EKS connection tunnel (Port: $PORT)"
echo "Target: $BASTION_USER@$BASTION_IP"
echo "--------------------------------------------------"

# 기존 프로세스 정리
fuser -k "$PORT/tcp" 2>/dev/null

# 백그라운드 터널링 실행
ssh -i "$KEY_PATH" -D "$PORT" -q -N -f "$BASTION_USER@$BASTION_IP"

if [ $? -eq 0 ]; then
    echo "Success: Tunnel is open. You can now use kubectl."
else
    echo "Error: Failed to connect. Check your key file path and AWS security groups."
fi
