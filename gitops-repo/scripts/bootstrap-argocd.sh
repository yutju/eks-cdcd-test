#!/bin/bash
# 1. 프로젝트 루트 경로 확보
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"
echo "--------------------------------------------------"
echo "GitOps 인프라 통합 부트스트랩 시작"
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
    echo "에러: CRD 주입에 실패했습니다."
    exit 1
fi
# Step 3: ArgoCD 본체 배포 및 인프라 노드 배치 설정 (반복문 패치 방식)
echo "[3/6] ArgoCD 인프라 본체 배포 진행 중 (Infra 노드 고정)..."
# 공식 매니페스트 배포
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# Deployment 및 StatefulSet에 패치 적용
echo "인프라 노드 고정 패치 적용 중..."
PATCH_JSON='{"spec": {"template": {"spec": {"nodeSelector": {"role": "infra"}, "tolerations": [{"key": "dedicated", "operator": "Equal", "value": "infra", "effect": "NoSchedule"}]}}}}'
for deploy in $(kubectl get deployments -n argocd -o name); do
  kubectl patch $deploy -n argocd -p "$PATCH_JSON"
done
for stateful in $(kubectl get statefulsets -n argocd -o name); do
  kubectl patch $stateful -n argocd -p "$PATCH_JSON"
done
if [ $? -ne 0 ]; then
    echo "에러: ArgoCD 본체 설치 및 패치에 실패했습니다."
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
    echo "에러: 제한 시간 내에 ArgoCD 서버 파드가 정상 가동되지 않았습니다."
    exit 1
fi
APP_YAML="kubernetes/cicd/argocd/bootstrap.yaml"
if [ -f "$APP_YAML" ]; then
    echo "시크릿 및 인프라 매니페스트 배포 시작..."
    
    echo "AWS SSM에서 Git 저장소 자격 증명 동적 주입 중..."
    REPO_CREDS_JSON=$(aws ssm get-parameter --name /his-main/argocd/gitops-repo-creds --with-decryption --query "Parameter.Value" --output text 2>/dev/null)
    if [ -n "$REPO_CREDS_JSON" ] && [ "$REPO_CREDS_JSON" != "null" ]; then
        REPO_URL=$(echo "$REPO_CREDS_JSON" | jq -r .url)
        REPO_USER=$(echo "$REPO_CREDS_JSON" | jq -r .username)
        REPO_PASS=$(echo "$REPO_CREDS_JSON" | jq -r .password)

        kubectl create secret generic gitops-repo-creds \
          -n argocd \
          --from-literal=url="$REPO_URL" \
          --from-literal=username="$REPO_USER" \
          --from-literal=password="$REPO_PASS" \
          --from-literal=type="git" \
          --dry-run=client -o yaml | kubectl apply -f -
        
        kubectl label secret gitops-repo-creds argocd.argoproj.io/secret-type=repository -n argocd --overwrite
    else
        echo "경고: SSM에서 Git 자격 증명을 가져오지 못했습니다. 수동 설정이 필요할 수 있습니다."
    fi

    kubectl delete networkpolicy --all -n argocd > /dev/null 2>&1
    echo "애플리케이션 주문서(bootstrap.yaml) 배포..."
    kubectl apply -f "$APP_YAML"
    echo "--------------------------------------------------"
    echo "부트스트랩 및 GitOps 연동 성공"
    echo "다음 명령어로 초기 비밀번호를 확인한 후 로그인하세요:"
    echo "  argocd admin initial-password -n argocd"
    echo "--------------------------------------------------"
else
    echo "에러: 필수 매니페스트 파일($APP_YAML)이 존재하지 않습니다."
    exit 1
fi

