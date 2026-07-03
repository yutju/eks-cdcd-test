#pf_log.sql
CREATE TABLE IF NOT EXISTS pf_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp VARCHAR(50),
    host VARCHAR(100),
    program VARCHAR(100),
    pid VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_host (host),
    INDEX idx_program (program)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
