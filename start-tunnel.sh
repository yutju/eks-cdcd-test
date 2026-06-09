#!/bin/bash

# 1. IP가 제대로 입력되었는지 확인 (입력값이 없으면 안내 후 종료)
if [ -z "$1" ]; then
    echo "❌ 배스천 호스트의 IP를 입력해주세요!"
    echo "💡 사용법: ./start-tunnel.sh <배스천_퍼블릭_IP>"
    echo "💡 예시: ./start-tunnel.sh 43.200.169.142"
    exit 1
fi

# 2. 설정 변수 (입력받은 IP를 BASTION_IP에 할당)
KEY_PATH="his-bastion-key.pem"
BASTION_USER="ubuntu"
BASTION_IP="$1"
PORT="1000"

echo "--------------------------------------------------"
echo "🚀 EKS 접속용 터널링 시작 (포트: $PORT)"
echo "대상: $BASTION_USER@$BASTION_IP"
echo "--------------------------------------------------"

# 기존에 1000번 포트를 물고 있는 좀비 SSH 터널이 있다면 정리
fuser -k $PORT/tcp 2>/dev/null

# -N: 터미널 쉘을 열지 않고 포트 포워딩만 수행
# -f: 백그라운드에서 실행 (스크립트 실행 후 즉시 프롬프트 반환)
ssh -i $KEY_PATH -D $PORT -q -N -f $BASTION_USER@$BASTION_IP

if [ $? -eq 0 ]; then
    echo "✅ 터널이 성공적으로 열렸습니다! 이제 kubectl 명령어를 사용할 수 있습니다."
else
    echo "❌ 터널 연결에 실패했습니다. 키 파일 경로와 AWS 보안 그룹(인바운드 IP)을 확인해 주세요."
fi
