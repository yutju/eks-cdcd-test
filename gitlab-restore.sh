#!/bin/bash

# 설정
BUCKET_NAME="his-gitlab-backup-dev-278584440977"
BACKUP_DIR="/var/opt/gitlab/backups"

# 사용자로부터 타임스탬프 입력받기
echo "복구할 백업 파일의 타임스탬프(파일명 앞부분)를 입력하세요:"
echo "(예: 1781598414_2026_06_16_19.0.2)"
read -p "입력: " TIMESTAMP

BACKUP_FILE="${TIMESTAMP}_gitlab_backup.tar"

echo "------------------------------------------"
echo "선택한 파일: ${BACKUP_FILE}"
echo "------------------------------------------"

# 1. 다운로드
echo "[1/6] S3에서 다운로드 중..."
sudo aws s3 cp s3://${BUCKET_NAME}/backups/${BACKUP_FILE} ${BACKUP_DIR}/ || { echo "다운로드 실패"; exit 1; }

# 2. 권한 설정
echo "[2/6] 권한 설정 중..."
sudo chown git:git ${BACKUP_DIR}/${BACKUP_FILE}
sudo chmod 600 ${BACKUP_DIR}/${BACKUP_FILE}

# 3. 서비스 중지
echo "[3/6] 서비스 중지 중..."
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq

# 4. 설정 구성
echo "[4/6] GitLab 재설정 중..."
sudo gitlab-ctl reconfigure

# 5. 복원 실행
echo "[5/6] 백업 복구 실행 중 (자동 승인)..."
echo "yes" | sudo gitlab-backup restore BACKUP=${TIMESTAMP}

# 6. 재시작
echo "[6/6] 서비스 재시작 중..."
sudo gitlab-ctl restart
sudo gitlab-ctl status

echo "복구가 완료되었습니다."
