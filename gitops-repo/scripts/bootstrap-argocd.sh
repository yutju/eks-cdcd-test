#!/bin/bash

# 1. 프로젝트 루트 경로 확보 (절대 실패하지 않는 표준 방식)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "--------------------------------------------------"
echo "ArgoCD GitOps 인프라 부트스트랩 시작"
echo "기준 경로: $PROJECT_ROOT"
echo "--------------------------------------------------"

# Step 1: CRD(문법) 선행 주입 (Server-Side Apply 적용)
echo "[1/5] ArgoCD 확장 문법(CRD) 클러스터에 주입 중..."
kubectl apply --server-side --force-conflicts -k https://github.com/argoproj/argo-cd/manifests/crds?ref=stable

if [ $? -ne 0 ]; then
    echo "에러: CRD 주입에 실패했습니다. 네트워크 상태나 kubectl 권한을 확인하세요."
    exit 1
fi

# Step 2: 네임스페이스 우선 생성 (분리된 파일 사용)
echo "[2/5] ArgoCD 전용 네임스페이스 생성 중..."
kubectl apply -f kubernetes/namespaces/argocd-ns.yaml

# Step 3: ArgoCD 본체 매니페스트 배포 (★여기도 Server-Side Apply 추가!★)
echo "[3/5] ArgoCD 인프라 본체 배포 진행 중..."
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

if [ $? -ne 0 ]; then
    echo "에러: ArgoCD 본체 설치에 실패했습니다."
    exit 1
fi

# Step 4: 파드 가동 대기 (타이밍 오류 방지를 위해 5초 대기 추가)
echo "[4/5] ArgoCD 서버가 켜질 때까지 자동 대기 중 (최대 5분)..."
echo "(API 서버 리소스 인식 대기 중... 5초 대기)"
sleep 5

# argocd-server 디플로이먼트가 사용 가능(Available) 상태가 될 때까지 멈춤
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

if [ $? -ne 0 ]; then
    echo "에러: 제한 시간 내에 ArgoCD 서버 파드가 정상 가동되지 않았습니다."
    kubectl get pods -n argocd
    exit 1
fi
echo "ArgoCD 핵심 서버 기동 완료!"

# Step 5: 프라이빗 인증키 및 앱 주문서 연동 (★멀티 레포 버전에 맞게 완벽 수정됨★)
echo "[5/5] 프라이빗 GitLab 인증키 및 Application(App of Apps) 배포 주문서 등록 중..."
# 🌟 수정됨: .gitignore에 의해 필터링되도록 이름이 변경된 시크릿 파일을 바라봅니다.
SECRET_YAML="kubernetes/cicd/argocd/argocd-repo-secret.yaml"
APP_YAML="kubernetes/cicd/argocd/bootstrap.yaml"

if [ -f "$SECRET_YAML" ] && [ -f "$APP_YAML" ]; then
    kubectl apply -f "$SECRET_YAML"
    kubectl apply -f "$APP_YAML"

    echo "--------------------------------------------------"
    echo "완벽합니다! ArgoCD 부트스트랩 및 GitOps 연동 성공"
    echo " 다음 명령어로 초기 비밀번호를 확인한 후 로그인하세요:"
    echo " argocd admin initial-password -n argocd"
    echo "--------------------------------------------------"
else
    echo "에러: 필수 매니페스트 파일($SECRET_YAML 또는 $APP_YAML)이 존재하지 않습니다."
    exit 1
fi
