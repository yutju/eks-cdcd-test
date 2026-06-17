#!/bin/bash

# 1. 프로젝트 루트 경로 확보
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "--------------------------------------------------"
echo "🚀 GitOps 인프라 통합 부트스트랩 시작"
echo "기준 경로: $PROJECT_ROOT"
echo "--------------------------------------------------"

# Step 1: 필수 네임스페이스 및 RBAC 사전 배포
echo "[1/6] 필수 네임스페이스 및 권한 설정 중..."
kubectl apply -f kubernetes/namespaces/argocd-ns.yaml
kubectl apply -f kubernetes/namespaces/jenkins-ns.yaml
kubectl apply -f kubernetes/namespaces/jenkins-build-ns.yaml
kubectl apply -f kubernetes/namespaces/apps-ns.yaml
kubectl apply -f kubernetes/namespaces/monitoring-ns.yaml
kubectl apply -f kubernetes/namespaces/security-ns.yaml
kubectl apply -f kubernetes/cicd/jenkins/jenkins-rbac.yaml

# Step 2: CRD(문법) 선행 주입
echo "[2/6] ArgoCD 확장 문법(CRD) 클러스터에 주입 중..."
kubectl apply --server-side --force-conflicts -k https://github.com/argoproj/argo-cd/manifests/crds?ref=stable

if [ $? -ne 0 ]; then
    echo "❌ 에러: CRD 주입에 실패했습니다."
    exit 1
fi

# Step 3: ArgoCD 본체 매니페스트 다운로드 및 인프라 노드 배치 설정 주입
echo "[3/6] ArgoCD 인프라 본체 배포 진행 중 (Infra 노드 고정)..."

# 공식 매니페스트 다운로드
curl -s https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml > argocd-install.yaml

# 🌟 중요: 모든 Deployment와 StatefulSet에 nodeSelector 및 tolerations 강제 삽입
sed -i '/spec:/a \      nodeSelector:\n        role: infra\n      tolerations:\n        - key: "dedicated"\n          operator: "Equal"\n          value: "infra"\n          effect: "NoSchedule"' argocd-install.yaml

# 수정된 매니페스트 배포
kubectl apply -n argocd --server-side --force-conflicts -f argocd-install.yaml
rm argocd-install.yaml

if [ $? -ne 0 ]; then
    echo "❌ 에러: ArgoCD 본체 설치에 실패했습니다."
    exit 1
fi

# Step 4: 외부 GitLab 통신 방해 네트워크 정책(NetworkPolicy) 강제 해제
echo "[4/6] 외부 인스턴스(GitLab) 통신 확보를 위해 기본 NetworkPolicy 자원 제어 중..."
kubectl delete networkpolicy --all -n argocd

# Step 5: 파드 가동 대기
echo "[5/6] ArgoCD 서버가 켜질 때까지 자동 대기 중 (최대 5분)..."
sleep 5
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

if [ $? -ne 0 ]; then
    echo "❌ 에러: 제한 시간 내에 ArgoCD 서버 파드가 정상 가동되지 않았습니다."
    exit 1
fi
echo "✅ ArgoCD 핵심 서버 기동 완료!"

# Step 6: 프라이빗 인증키 및 앱 주문서 연동
echo "[6/6] 프라이빗 GitLab 인증키 및 Application(App of Apps) 배포 주문서 등록 중..."

SECRET_REPO="kubernetes/cicd/argocd/argocd-repo-secret.yaml"
SECRET_GITLAB="kubernetes/cicd/jenkins/gitlab-api-secret.yaml"
SECRET_JENKINS="kubernetes/cicd/jenkins/jenkins-secret.yaml"
APP_YAML="kubernetes/cicd/argocd/bootstrap.yaml"

if [ -f "$APP_YAML" ]; then
    echo "🔑 시크릿 및 인프라 매니페스트 배포 시작..."

    [ -f "$SECRET_REPO" ] && kubectl apply -f "$SECRET_REPO"
    [ -f "$SECRET_GITLAB" ] && kubectl apply -f "$SECRET_GITLAB"
    [ -f "$SECRET_JENKINS" ] && kubectl apply -f "$SECRET_JENKINS"

    echo "🔗 기존 인증 정보(gitops-repo-creds) 레이블 업데이트 중..."
    kubectl label secret gitops-repo-creds argocd.argoproj.io/secret-type=repository -n argocd --overwrite

    kubectl delete networkpolicy --all -n argocd > /dev/null 2>&1

    echo "📦 애플리케이션 주문서(bootstrap.yaml) 배포..."
    kubectl apply -f "$APP_YAML"

    echo "--------------------------------------------------"
    echo "✅ 부트스트랩 및 GitOps 연동 성공!"
    echo " 다음 명령어로 초기 비밀번호를 확인한 후 로그인하세요:"
    echo " argocd admin initial-password -n argocd"
    echo "--------------------------------------------------"
else
    echo "❌ 에러: 필수 매니페스트 파일($APP_YAML)이 존재하지 않습니다."
    exit 1
fi
