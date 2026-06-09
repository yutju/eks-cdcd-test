#!/bin/bash

# 고정된 3개의 클러스터 이름을 배열로 선언합니다.
CLUSTERS=(
  "his-main-eks-devops"
  "his-main-eks-vdi-internal"
  "his-main-eks-main"
)

REGION="ap-northeast-2"
PROXY="socks5://localhost:1000"

echo "🚀 총 ${#CLUSTERS[@]}개의 클러스터 접속 정보 다운로드 및 터널 연결을 시작합니다..."
echo "--------------------------------------------------"

# 배열에 있는 클러스터 개수만큼 알아서 반복 실행합니다.
for CLUSTER_NAME in "${CLUSTERS[@]}"; do
  echo "🔄 [$CLUSTER_NAME] 접속 정보 다운로드 중..."
  # 1. 지도 다운로드 (실행 시 타겟이 이 클러스터로 자동 전환됨)
  aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME > /dev/null 2>&1

  # 2. 방금 타겟으로 잡힌 클러스터의 진짜 풀네임(ARN) 추출
  CLUSTER_ARN=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')

  echo "🚇 [$CLUSTER_NAME] 에 터널($PROXY) 자동 연결 중..."
  # 3. 프록시 주소 꽂아넣기
  kubectl config set-cluster "$CLUSTER_ARN" --proxy-url=$PROXY > /dev/null 2>&1
  
  echo "✅ [$CLUSTER_NAME] 세팅 완료!"
  echo "--------------------------------------------------"
done

echo "🎉 모든 클러스터의 로컬 셋업이 완벽하게 끝났습니다!"
echo "👉 'kubectx' 명령어로 원하는 타겟을 선택한 후 'kubectl get nodes'를 쳐보세요!"
