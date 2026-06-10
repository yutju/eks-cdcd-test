#!/bin/bash

# 1. 고정 설정값
KEY_FILE="his-bastion-key.pem"
BASTION_USER="ubuntu"
GITLAB_USER="ubuntu"
GITLAB_IP="10.0.4.10"
DEFAULT_BASTION_IP="15.164.230.26"

# 2. SSH 에이전트 설정
echo "Setting up SSH agent..."
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)" > /dev/null
fi

if ! ssh-add -l | grep -q "$(ssh-keygen -lf "$KEY_FILE" | awk '{print $2}')"; then
    chmod 400 "$KEY_FILE" 2>/dev/null
    ssh-add "$KEY_FILE"
fi

echo "Current SSH keys registered:"
ssh-add -l

# 3. Bastion IP 입력
echo "========================================"
read -p "Enter Bastion IP (Default: $DEFAULT_BASTION_IP): " INPUT_IP
BASTION_IP=${INPUT_IP:-$DEFAULT_BASTION_IP}

echo "========================================"
echo "Connecting to GitLab ($GITLAB_IP) via Bastion ($BASTION_IP)..."
echo "========================================"

# 4. SSH ProxyJump 실행
ssh -A -J "$BASTION_USER@$BASTION_IP" "$GITLAB_USER@$GITLAB_IP"
