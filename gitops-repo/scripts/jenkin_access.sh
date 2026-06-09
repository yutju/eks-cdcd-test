#!/bin/bash
# jenkins_access.sh

echo "----------------------------------------------------"
echo "🚀 젠킨스 외부 접속 개방 스크립트 (현재 IP: 192.168.72.132)"
echo "----------------------------------------------------"

# 1. 방화벽(UFW)에서 포트 열기
sudo ufw allow 9999/tcp
sudo ufw allow 32000/tcp
sudo ufw allow 30080/tcp
sudo ufw reload

# 2. IP Forwarding 활성화
sudo sysctl -w net.ipv4.ip_forward=1

# 3. iptables 규칙 초기화 및 재설정 (8888 -> 32000)
sudo iptables -t nat -F
sudo iptables -t nat -A PREROUTING -p tcp --dport 8888 -j REDIRECT --to-ports 32000

# 4. 결과 확인
echo "✅ 설정 완료!"
echo "👉 윈도우 브라우저 주소창에 입력: http://192.168.72.132:9999"
echo "----------------------------------------------------"
