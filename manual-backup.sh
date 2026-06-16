#!/bin/bash

echo "=================================================="
echo "GitLab 수동 S3 백업 스크립트를 시작합니다..."
echo "=================================================="

# 1. 버킷 이름 추출
BUCKET=$(/usr/local/bin/aws s3 ls | grep gitlab-backup | awk '{print $3}' | head -n 1)

# 2. 안전장치(Safety Guard) 및 백업 실행
if [ -z "$BUCKET" ]; then
  echo "오류: S3 버킷을 찾을 수 없거나 IAM 권한이 부족합니다."
  exit 1
else
  echo "타겟 버킷 발견: $BUCKET"
  echo "데이터베이스 및 레포지토리 백업을 생성 중입니다..."
  
  # 백업 생성 (레지스트리 제외)
  if sudo gitlab-backup create SKIP=registry; then
    echo "백업 파일 생성 완료. S3로 업로드를 시작합니다..."
    
    # S3 동기화 및 핵심 파일 복사
    sudo /usr/local/bin/aws s3 sync /var/opt/gitlab/backups/ "s3://$BUCKET/backups/" --delete && \
    sudo /usr/local/bin/aws s3 cp /etc/gitlab/gitlab.rb "s3://$BUCKET/config/gitlab.rb" && \
    sudo /usr/local/bin/aws s3 cp /etc/gitlab/gitlab-secrets.json "s3://$BUCKET/config/gitlab-secrets.json"
    
    echo "=================================================="
    echo "S3 백업 업로드가 완벽하게 완료되었습니다!"
    echo "=================================================="
  else
    echo "오류: GitLab 백업 생성 과정에서 문제가 발생했습니다."
    exit 1
  fi
fi
