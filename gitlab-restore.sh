#!/bin/bash

# 설정
TIMESTAMP="1781697447_2026_06_17_19.0.2"
BACKUP_FILE="${TIMESTAMP}_gitlab_backup.tar"
BACKUP_DIR="/var/opt/gitlab/backups"

echo "=========================================="
echo "GitLab 복구 자동화 스크립트 시작"
echo "=========================================="

# 1. 설정 및 권한 재설정
echo "[1/4] 설정 및 권한 재설정 중..."
sudo gitlab-ctl reconfigure
sudo chown git:git ${BACKUP_DIR}/${BACKUP_FILE}
sudo chmod 600 ${BACKUP_DIR}/${BACKUP_FILE}

# 2. 서비스 중지
echo "[2/4] 서비스 중지 중..."
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq

# 3. 데이터 복구
echo "[3/4] 데이터 복구 실행 중..."
echo "yes" | sudo gitlab-backup restore BACKUP=${TIMESTAMP}

# 4. 서비스 재시작
echo "[4/4] 서비스 재시작 중..."
sudo gitlab-ctl restart
sudo gitlab-ctl status

echo "=========================================="
echo "복구 작업이 모두 완료되었습니다."
echo "=========================================="
