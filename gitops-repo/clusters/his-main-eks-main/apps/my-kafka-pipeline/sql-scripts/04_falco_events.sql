CREATE TABLE IF NOT EXISTS falco_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cluster_name VARCHAR(20),

    uuid VARCHAR(100),

    priority VARCHAR(20) NOT NULL,

    rule_name VARCHAR(255) NOT NULL,

    output TEXT NOT NULL,

    source VARCHAR(50),

    hostname VARCHAR(255),

    tags JSON,

    event_time DATETIME NOT NULL,

    raw_event JSON NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_priority (priority),
    INDEX idx_event_time (event_time),
    INDEX idx_rule_name (rule_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;