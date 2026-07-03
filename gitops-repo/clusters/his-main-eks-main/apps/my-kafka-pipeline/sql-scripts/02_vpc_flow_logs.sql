CREATE TABLE IF NOT EXISTS vpc_flow_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    version VARCHAR(10),
    srcaddr VARCHAR(50) NOT NULL,
    dstaddr VARCHAR(50) NOT NULL,
    srcport VARCHAR(10),
    dstport VARCHAR(10),
    protocol VARCHAR(10),
    action VARCHAR(20) NOT NULL,
    bytes VARCHAR(50),
    packets VARCHAR(50),
    start VARCHAR(50),
    end VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_time_action (start, action),
    INDEX idx_ips (srcaddr, dstaddr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;