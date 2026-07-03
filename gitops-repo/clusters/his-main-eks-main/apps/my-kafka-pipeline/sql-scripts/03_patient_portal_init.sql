-- patient_portal DB 생성
CREATE DATABASE IF NOT EXISTS patient_portal;

-- dbmgr 계정 생성
CREATE USER IF NOT EXISTS 'dbmgr'@'%' IDENTIFIED BY '1234';

-- patient_portal 권한 부여
GRANT ALL PRIVILEGES ON patient_portal.* TO 'dbmgr'@'%';

FLUSH PRIVILEGES;
