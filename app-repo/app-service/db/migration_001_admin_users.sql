-- db/migration_001_admin_users.sql
-- 이미 schema_mysql.sql을 적용해서 운영 중인 DB(예: 192.168.100.50)에
-- admin_users 테이블만 추가로 생성할 때 사용합니다.
--
-- 적용 방법:
--   mysql -h 192.168.100.50 -u portal_app -p patient_portal < db/migration_001_admin_users.sql

USE patient_portal;

CREATE TABLE IF NOT EXISTS admin_users (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    login_id        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
