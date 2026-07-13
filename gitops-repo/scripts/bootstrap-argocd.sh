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
# openemr 네임스페이스는 여전히 미리 생성해 둔다.
#   (ESO ExternalSecret이 이 네임스페이스로 openemr 시크릿을 만들어 넣으므로,
#    네임스페이스는 시크릿 동기화 전에 존재해야 함)
kubectl apply -f kubernetes/apps/openemr/namespace.yaml
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
echo "ArgoCD 핵심 서버 기동 완료"
# Step 6: 프라이빗 인증키 및 앱 주문서 연동
echo "[6/6] 프라이빗 GitLab 인증키 및 Application(App of Apps) 배포 주문서 등록 중..."
#
# ─────────────────────────────────────────────────────────────
# [ESO 전환] 애플리케이션 시크릿은 이제 External Secrets Operator(ESO)가
#   AWS SSM Parameter Store에서 가져와 생성한다. 따라서 아래 앱 시크릿들의
#   수동 kubectl apply 는 제거(주석 처리)했다.
#
#   ★ 단, argocd-repo-secret(gitops-repo-creds)만은 예외로 반드시 수동 유지.
#     ArgoCD가 이 자격증명으로 gitops repo를 pull해야 하는데, ESO 자체가
#     그 repo에서 ArgoCD로 배포되므로(순환 의존) ESO가 만들 수 없다. = 부트스트랩 씨앗.
#
#   ★ 앱 시크릿 주석 제거 전 반드시 확인할 것:
#     1) kubernetes/cicd/external-secrets/ 에 각 시크릿의 ExternalSecret +
#        (Cluster)SecretStore 매니페스트가 있고 name/namespace/key가 소비처와 일치
#     2) SSM(/his-main/...)에 해당 값이 존재
#     3) sync-wave 순서: ESO 오퍼레이터(-1) → SecretStore/ExternalSecrets(0) → 소비 앱(그 이후)
#     4) 버릴 수 있는 클러스터에서 콜드스타트 부트스트랩으로 검증 완료
# ─────────────────────────────────────────────────────────────
#
# [유지] 부트스트랩 씨앗 — ArgoCD repo 자격증명 (ESO로 대체 불가)
SECRET_REPO="kubernetes/cicd/argocd/argocd-repo-secret.yaml"
# 프로메테우스 별칭 파일 경로 (시크릿 아님 — 유지)
PROMETHEUS_ALIAS="kubernetes/cicd/monitoring/prometheus-alias.yaml"
APP_YAML="kubernetes/cicd/argocd/bootstrap.yaml"
#
# [ESO 전환으로 제거] 아래 앱 시크릿들은 ESO가 SSM에서 생성 → 수동 apply 불필요.
#   (검증 완료 후 이 변수/apply 라인은 완전히 삭제해도 됨)
# SECRET_GITLAB="kubernetes/cicd/jenkins/gitlab-api-secret.yaml"
# SECRET_JENKINS="kubernetes/cicd/jenkins/jenkins-secret.yaml"
# SECRET_GRAFANA_SMTP="kubernetes/cicd/monitoring/grafana-smtp-secret.yaml"
# SECRET_APP_SERVICE="kubernetes/apps/app-service/app-service-secret.yaml"   # web-apps / web-apps-test
# SECRET_OPENEMR_DB="kubernetes/apps/openemr/db-secret.yaml"
# SECRET_OPENEMR_SQLCONF="kubernetes/apps/openemr/sqlconf-secret.yaml"
#
if [ -f "$APP_YAML" ]; then
    echo "시크릿(씨앗) 및 인프라 매니페스트 배포 시작..."
    # [유지] 부트스트랩 씨앗 시크릿 — ArgoCD repo 자격증명
    [ -f "$SECRET_REPO" ] && kubectl apply -f "$SECRET_REPO"

    # [ESO 전환으로 제거] 앱 시크릿 수동 apply 중단 — ESO가 SSM에서 생성함
    # [ -f "$SECRET_GITLAB" ] && kubectl apply -f "$SECRET_GITLAB"
    # [ -f "$SECRET_JENKINS" ] && kubectl apply -f "$SECRET_JENKINS"
    # [ -f "$SECRET_GRAFANA_SMTP" ] && kubectl apply -f "$SECRET_GRAFANA_SMTP"
    # [ -f "$SECRET_APP_SERVICE" ] && kubectl apply -f "$SECRET_APP_SERVICE"
    # [ -f "$SECRET_OPENEMR_DB" ] && kubectl apply -f "$SECRET_OPENEMR_DB"
    # [ -f "$SECRET_OPENEMR_SQLCONF" ] && kubectl apply -f "$SECRET_OPENEMR_SQLCONF"

    # 프로메테우스 별칭 서비스 배포 실행 (시크릿 아님 — 유지)
    [ -f "$PROMETHEUS_ALIAS" ] && kubectl apply -f "$PROMETHEUS_ALIAS"
    echo "기존 인증 정보(gitops-repo-creds) 레이블 업데이트 중..."
    kubectl label secret gitops-repo-creds argocd.argoproj.io/secret-type=repository -n argocd --overwrite
    kubectl delete networkpolicy --all -n argocd > /dev/null 2>&1
    echo "애플리케이션 주문서(bootstrap.yaml) 배포..."
    kubectl apply -f "$APP_YAML"
    echo "--------------------------------------------------"
    echo "부트스트랩 및 GitOps 연동 성공"
    echo "앱 시크릿은 ESO가 SSM에서 생성합니다. 생성 확인:"
    echo "  kubectl get externalsecret -A"
    echo "  kubectl get secret -A | grep -E 'gitlab-api-secret|jenkins|app-service-secret|openemr'"
    echo "다음 명령어로 초기 비밀번호를 확인한 후 로그인하세요:"
    echo "  argocd admin initial-password -n argocd"
    echo "--------------------------------------------------"
else
    echo "에러: 필수 매니페스트 파일($APP_YAML)이 존재하지 않습니다."
    exit 1
fi
