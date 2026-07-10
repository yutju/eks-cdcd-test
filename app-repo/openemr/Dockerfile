# app-repo/openemr/Dockerfile
# ─────────────────────────────────────────────────────────────
# OpenEMR DR 미러링용 passthrough Dockerfile.
#   - openemr는 공식 이미지를 그대로 사용하고(소스 커스터마이즈 없음),
#     실제 설정(php.ini, sqlconf.php, config.php)은 gitops의 configmap/secret으로
#     런타임에 마운트된다. 따라서 별도 빌드 로직이 필요 없다.
#   - 이 Dockerfile은 공식 openemr 이미지를 그대로 가져와(ECR/ACR로) 재배포하기 위한 것.
#     Kaniko가 이 단일 스테이지를 빌드해 --destination 들(ECR, ACR)로 push한다.
#
# [버전 주의] 배포(deployment.yaml)가 :latest 를 쓰므로 여기서도 latest 를 미러링한다.
#   DR 재현성을 원하면 실제 운영 버전으로 고정(pin) 권장. 예: openemr/openemr:7.0.3
#   단, 고정 시 config가 기대하는 PHP 버전(현재 마운트 경로가 /etc/php84/...)과
#   이미지의 PHP 버전이 일치하는 태그를 선택해야 한다.
# ─────────────────────────────────────────────────────────────
FROM openemr/openemr:latest

# Kaniko가 반드시 레이어를 만들어 push하도록 하는 메타데이터(무해).
LABEL dr.mirror="openemr official image mirrored to AWS ECR + Azure ACR for DR"
