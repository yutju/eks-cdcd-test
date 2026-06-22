#!/bin/bash
set -e

BUCKET="his-gitlab-backup-dev-278584440977"
LATEST=$(aws s3 ls "s3://${BUCKET}/backups/" | sort | tail -1 | awk '{print $4}')

if [ -z "$LATEST" ]; then
  echo "백업 파일을 찾을 수 없습니다."
  exit 1
fi

echo "가장 최신 백업 파일: $LATEST"
sudo mkdir -p /var/opt/gitlab/backups
sudo aws s3 cp "s3://${BUCKET}/backups/${LATEST}" /var/opt/gitlab/backups/
sudo chown git:git /var/opt/gitlab/backups/${LATEST}
sudo chmod 600 /var/opt/gitlab/backups/${LATEST}

echo "서비스 중지 중..."
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq
sudo gitlab-ctl stop gitlab-workhorse

BACKUP_ID=$(echo ${LATEST} | sed 's/_gitlab_backup.tar//')

echo "복구 시작: ${BACKUP_ID}"
sudo -u git /opt/gitlab/bin/gitlab-backup restore BACKUP=${BACKUP_ID} force=yes

echo "서비스 재시작 중..."
sudo gitlab-ctl start
sudo gitlab-ctl reconfigure
echo "복구 완료!"
