DROP DATABASE IF EXISTS gasify;
CREATE DATABASE IF NOT EXISTS gasify
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE gasify;

-- ==================================
-- NOTIFICATION TYPE TABLE
-- ==================================
CREATE TABLE notification_type (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_notification_type_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================
-- USER TABLE
-- ==================================
CREATE TABLE user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_user_email (email)
);  

-- ==================================
-- NOTIFICATION TABLE
-- ==================================
CREATE TABLE notification (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type_id TINYINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_notification_user (user_id),
  INDEX idx_notification_user_created (user_id, created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_notification_type FOREIGN KEY (type_id)
    REFERENCES notification_type(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================
-- PASSWORD RESET CODE TABLE
-- ==================================
CREATE TABLE password_reset_code (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code CHAR(6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_recovery_code (code),
  INDEX idx_recovery_user (user_id),
  CONSTRAINT fk_recovery_user FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================
-- DEVICE TABLE
-- ==================================
CREATE TABLE device (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255) NOT NULL,
  located_at VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_device_serial (serial_number),
  INDEX idx_device_user (user_id),
  CONSTRAINT fk_device_user FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================
-- INSERT NOTIFICATION TYPES
-- ==================================
INSERT INTO notification_type (name) VALUES
('Important'),
('Regular');

-- ==================================
-- INSERT USERS (password = 'aBc12345678!')
-- ==================================
INSERT INTO user (full_name, email, password_hash)
VALUES
('Alice Johnson', 'alice.johnson@example.com', '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC'),
('Bob Smith', 'bob.smith@example.com', '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC'),
('Charlie Davis', 'charlie.davis@example.com', '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC'),
('Dana Lee', 'dana.lee@example.com', '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC');

-- ==================================
-- INSERT NOTIFICATIONS
-- ==================================
-- Alice (user_id = 1)
INSERT INTO notification (user_id, type_id, title, body, read_at)
VALUES
(1, 1, 'Welcome to Gasify', 'Your account has been created successfully.', NOW() - INTERVAL 1 DAY),  -- read
(1, 2, 'Weekly Tips', 'Remember to check your gas usage weekly.', NULL);  -- unread

-- Bob (user_id = 2)
INSERT INTO notification (user_id, type_id, title, body, read_at)
VALUES
(2, 1, 'Account Verification', 'Please verify your email to activate your account.', NULL);  -- unread

-- Dana (user_id = 4)
INSERT INTO notification (user_id, type_id, title, body, read_at)
VALUES
(4, 2, 'Regular Update', 'This is a regular notification about your account.', NOW() - INTERVAL 2 HOUR);  -- read

-- ==================================
-- INSERT PASSWORD RECOVERY CODES
-- ==================================
-- Alice (user_id = 1)
INSERT INTO password_reset_code (user_id, code, created_at, expires_at, used_at)
VALUES
(1, 'A1B2C3', NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 10 MINUTE),  -- used
(1, 'D4E5F6', NOW(), NOW() + INTERVAL 10 MINUTE, NULL);  -- still valid

-- Bob (user_id = 2)
INSERT INTO password_reset_code (user_id, code, created_at, expires_at, used_at)
VALUES
(2, 'G7H8I9', NOW() - INTERVAL 5 MINUTE, NOW() + INTERVAL 5 MINUTE, NULL);  -- valid

-- Dana (user_id = 4)
INSERT INTO password_reset_code (user_id, code, created_at, expires_at, used_at)
VALUES
(4, 'J0K1L2', NOW() - INTERVAL 20 MINUTE, NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 15 MINUTE);  -- expired and used

-- ==================================
-- INSERT DEVICES
-- ==================================
-- Alice (user_id = 1)
INSERT INTO device (user_id, name, serial_number, located_at)
VALUES
(1, 'Gas Sensor A1', 'SN-A1-001', 'Kitchen'),
(1, 'Gas Meter Alpha', 'SN-A1-002', 'Garage');

-- Bob (user_id = 2)
INSERT INTO device (user_id, name, serial_number, located_at)
VALUES
(2, 'Pressure Sensor B1', 'SN-B2-001', 'Basement'),
(2, 'Gas Detector Pro', 'SN-B2-002', 'Kitchen');

-- Charlie (user_id = 3)
INSERT INTO device (user_id, name, serial_number, located_at)
VALUES
(3, 'Gas Sensor C1', 'SN-C3-001', 'Hallway');

-- Dana (user_id = 4)
INSERT INTO device (user_id, name, serial_number, located_at)
VALUES
(4, 'Gas Controller D1', 'SN-D4-001', 'Living Room'),
(4, 'Leak Detector D2', 'SN-D4-002', 'Kitchen');