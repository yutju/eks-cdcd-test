# 01_iam_audit_logs.sql
CREATE TABLE IF NOT EXISTS iam_audit_logs (
    event_id CHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    source_ip VARCHAR(45) NOT NULL,
    actor TEXT NOT NULL,
    is_new_signup TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

