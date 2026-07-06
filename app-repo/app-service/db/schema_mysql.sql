-- db/schema_mysql.sql
-- PostgreSQL 스키마를 MySQL 8.0 기준으로 전환
-- 변경점: UUID -> CHAR(36) + UUID() 함수, SERIAL -> AUTO_INCREMENT,
--        now() -> CURRENT_TIMESTAMP, RETURNING 제거(애플리케이션에서 SELECT로 대체)

CREATE DATABASE IF NOT EXISTS patient_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patient_portal;

CREATE TABLE patients_local (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    login_id        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    rrn_hash        VARCHAR(255),
    phone           VARCHAR(20) NOT NULL,
    email           VARCHAR(100),
    openemr_pid     VARCHAR(50),
    is_verified     TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE admin_users (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    login_id        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE board_posts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    board_type  VARCHAR(20) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    author_id   CHAR(36),
    is_private  TINYINT(1) DEFAULT 0,
    view_count  INT DEFAULT 0,
    is_answered TINYINT(1) DEFAULT 0,
    is_notice   TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE board_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    post_id     INT NOT NULL,
    author_id   CHAR(36),
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE login_sessions (
    id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id  CHAR(36),
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE appointment_local (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      CHAR(36),
    openemr_appt_id VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NULL,
    department      VARCHAR(50),
    doctor_name     VARCHAR(50),
    is_telemedicine TINYINT(1) DEFAULT 0,
    notify_sent     TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE health_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    patient_id  CHAR(36),
    log_type    VARCHAR(20) NOT NULL,
    value_1     DECIMAL(6,2),
    value_2     DECIMAL(6,2),
    memo        VARCHAR(200),
    measured_at TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE wearable_link (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    patient_id    CHAR(36),
    provider      VARCHAR(30),
    access_token  TEXT,
    refresh_token TEXT,
    linked_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE secure_messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    thread_id       CHAR(36) NOT NULL,
    sender_type     VARCHAR(10) NOT NULL,
    sender_id       VARCHAR(50) NOT NULL,
    patient_id      CHAR(36),
    content         TEXT NOT NULL,
    is_read         TINYINT(1) DEFAULT 0,
    attachment_path VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE telemedicine_session (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  INT,
    patient_id      CHAR(36),
    room_name       VARCHAR(100) UNIQUE NOT NULL,
    status          VARCHAR(20) DEFAULT 'scheduled',
    scheduled_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment_local(id),
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;

CREATE TABLE notification_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    patient_id  CHAR(36),
    channel     VARCHAR(10),
    purpose     VARCHAR(30),
    content     TEXT,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success     TINYINT(1),
    FOREIGN KEY (patient_id) REFERENCES patients_local(id)
) ENGINE=InnoDB;
