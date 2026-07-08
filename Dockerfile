FROM jenkins/jenkins:2.528.1-jdk21
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

# 플러그인 설치 실패 시 이미지 빌드도 실패하게 함
# (--skip-failed-plugins가 실패를 숨겨서 불완전한 이미지가 배포됐던 문제 방지)
RUN jenkins-plugin-cli --verbose -f /usr/share/jenkins/ref/plugins.txt
