-- Takis Promotional System Schema

-- Users Table
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    role ENUM('admin', 'client') DEFAULT 'client',
    points INT DEFAULT 0,
    address VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    zip_code VARCHAR(10) DEFAULT NULL,
    session_version INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Promo Codes Table
CREATE TABLE promo_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    points INT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_user_id INT UNSIGNED DEFAULT NULL,
    used_at DATETIME DEFAULT NULL,
    INDEX idx_code (code),
    CONSTRAINT fk_promo_user FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Rewards Table
CREATE TABLE rewards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('digital', 'physical') NOT NULL,
    cost INT NOT NULL,
    stock INT NOT NULL,
    image_url VARCHAR(255),
    pdf_template VARCHAR(255) DEFAULT NULL,
    coordinates TEXT DEFAULT NULL, -- JSON string with printable locations
    font_size INT DEFAULT 12,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Output Codes for Rewards (Digital)
CREATE TABLE reward_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reward_id INT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reward_code FOREIGN KEY (reward_id) REFERENCES rewards(id)
) ENGINE=InnoDB;

-- Redemptions Table
CREATE TABLE redemptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    reward_id INT UNSIGNED NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    digital_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemption_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_redemption_reward FOREIGN KEY (reward_id) REFERENCES rewards(id)
) ENGINE=InnoDB;

-- Security Logs (Anti-Fraud)
CREATE TABLE security_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_id INT UNSIGNED DEFAULT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_date (ip_address, created_at)
) ENGINE=InnoDB;

-- Tickets Table (Support)
CREATE TABLE tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'closed') DEFAULT 'open',
    admin_reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Seed Data (Optional for testing)
INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin@takis.com', '$2y$10$8C7QG7lR.mY5p/zQvF7q.e1V8s1Gv.B2yJ6.5LdM.9yQv5Ew5.7q.', 'Admin Maestro', 'admin');
INSERT INTO rewards (title, description, type, cost, stock, image_url) VALUES 
('Takis Blue Heat Box', 'Caja de 24 unidades de Takis Blue Heat.', 'physical', 500, 10, 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519'),
('Tarjeta Amazon $10', 'Código digital de $10 USD para Amazon.', 'digital', 1000, 50, 'https://images.unsplash.com/photo-1558403194-611308249627');
