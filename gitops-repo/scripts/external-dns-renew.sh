#!/bin/bash
CLUSTER_NAME="his-main-eks-devops"
ROLE_NAME="his-main-external-dns-role"

# 1. OIDC ID 추출
OIDC_URL=$(aws eks describe-cluster --name $CLUSTER_NAME --query "cluster.identity.oidc.issuer" --output text)
OIDC_ID=$(echo $OIDC_URL | cut -d'/' -f5)

# 2. 신뢰 정책 JSON 생성 (자동화)
cat <<EOF > trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::278584440977:oidc-provider/oidc.eks.ap-northeast-2.amazonaws.com/id/$OIDC_ID" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.ap-northeast-2.amazonaws.com/id/$OIDC_ID:sub": "system:serviceaccount:monitoring:external-dns"
        }
      }
    }
  ]
}
EOF

# 3. 정책 적용
aws iam update-assume-role-policy --role-name $ROLE_NAME --policy-document file://trust-policy.json
echo " IAM 신뢰 정책 업데이트 완료!"

# 🌟 4. [추가됨] 귀찮은 파드 재시작 자동화
echo " 새로운 권한을 적용하기 위해 ExternalDNS 파드를 재시작합니다..."
kubectl rollout restart deployment external-dns -n monitoring
echo "모든 복구 프로세스가 1초 만에 완료되었습니다!"
