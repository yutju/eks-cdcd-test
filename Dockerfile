FROM jenkins/jenkins:2.528.1-jdk21
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

#  --skip-failed-plugins 옵션으로 교체
RUN jenkins-plugin-cli --skip-failed-plugins -f /usr/share/jenkins/ref/plugins.txt
