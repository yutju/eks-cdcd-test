#!/bin/bash
set -euxo pipefail

# 1. 환경 설정
BUCKET="his-gitlab-backup-dev-278584440977"
BACKUP_DIR="/var/opt/gitlab/backups"

# 2. 최신 백업 파일 가져오기
LATEST=$(aws s3 ls "s3://${BUCKET}/backups/" | sort | tail -1 | awk '{print $4}')

sudo mkdir -p ${BACKUP_DIR}
sudo aws s3 cp "s3://${BUCKET}/backups/${LATEST}" ${BACKUP_DIR}/
sudo chown git:git ${BACKUP_DIR}/${LATEST}
sudo chmod 600 ${BACKUP_DIR}/${LATEST}

# 3. 데이터베이스 슈퍼유저 권한 부여
echo "ALTER USER gitlab WITH SUPERUSER;" | sudo gitlab-psql -d template1

# 4. 서비스 정지
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq
sudo gitlab-ctl stop gitlab-workhorse

# 5. 복구 실행
BACKUP_ID=$(echo ${LATEST} | sed 's/_gitlab_backup.tar//')

echo "복구 시작: ${BACKUP_ID}"
# 여기 중요: git 계정 권한으로 실행하되, 백업 파일의 권한을 미리 확보해야 함
sudo -u git /opt/gitlab/bin/gitlab-backup restore BACKUP=${BACKUP_ID} force=yes

# 6. 서비스 정상화 및 권한 복구
sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart

# 7. 슈퍼유저 권한 회수
echo "ALTER USER gitlab WITH NOSUPERUSER;" | sudo gitlab-psql -d template1
echo "복구 완료!"
