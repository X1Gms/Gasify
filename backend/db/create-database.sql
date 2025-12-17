SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `gasify`;
CREATE SCHEMA IF NOT EXISTS `gasify`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE `gasify`;

-- ==================================
-- USER TABLE
-- ==================================
CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_user_email` ON `user` (`email`);

-- ==================================
-- COUNTRY TABLE
-- ==================================
CREATE TABLE `country` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `iso_code` CHAR(2) NOT NULL,
  `emergency_number` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_country_name` ON `country` (`name`);
CREATE UNIQUE INDEX `ux_country_iso` ON `country` (`iso_code`);

-- ==================================
-- DEVICE TABLE
-- ==================================
CREATE TABLE `device` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `country_id` SMALLINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `serial_number` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_device_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_device_country`
    FOREIGN KEY (`country_id`)
    REFERENCES `country` (`id`)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_device_serial` ON `device` (`serial_number`);
CREATE INDEX `idx_device_user` ON `device` (`user_id`);
CREATE INDEX `idx_device_country` ON `device` (`country_id`);

-- ==================================
-- NOTIFICATION TYPE TABLE
-- ==================================
CREATE TABLE `notification_type` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_notification_type_name`
ON `notification_type` (`name`);

-- ==================================
-- NOTIFICATION TABLE
-- ==================================
CREATE TABLE `notification` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type_id` TINYINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notification_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notification_type`
    FOREIGN KEY (`type_id`)
    REFERENCES `notification_type` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX `idx_notification_user` ON `notification` (`user_id`);
CREATE INDEX `idx_notification_user_created`
ON `notification` (`user_id`, `created_at`);
CREATE INDEX `idx_notification_type` ON `notification` (`type_id`);

-- ==================================
-- PASSWORD RESET CODE TABLE
-- ==================================
CREATE TABLE `password_reset_code` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `code` CHAR(6) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_recovery_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_recovery_code`
ON `password_reset_code` (`code`);
CREATE INDEX `idx_recovery_user`
ON `password_reset_code` (`user_id`);

-- ==================================
-- READINGS TABLE
-- ==================================
CREATE TABLE `readings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` BIGINT UNSIGNED NOT NULL,
  `gas_type` ENUM('LPG','Methane','CO','Smoke') NOT NULL,
  `humidity` DECIMAL(5,2),
  `temperature` DECIMAL(5,2),
  `mq2` SMALLINT,
  `mq5` SMALLINT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_readings_device`
    FOREIGN KEY (`device_id`)
    REFERENCES `device` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `idx_readings_device`
ON `readings` (`device_id`);

-- ==================================
-- MCU DETECTION TABLE
-- ==================================
CREATE TABLE `mcu_detection` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `readings_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `canceled` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mcu_detection_readings`
    FOREIGN KEY (`readings_id`)
    REFERENCES `readings` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `idx_mcu_detection_readings`
ON `mcu_detection` (`readings_id`);

-- ==================================
-- INSERT USERS (password = 'aBc12345678!')
-- ==================================
SET @pwd := '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC';

INSERT INTO user (full_name, email, password_hash) VALUES
('Alice Johnson', 'alice.johnson@example.com', @pwd),
('Bob Smith', 'bob.smith@example.com', @pwd),
('Charlie Davis', 'charlie.davis@example.com', @pwd),
('Dana Lee', 'dana.lee@example.com', @pwd);

-- ==================================
-- INSERT COUNTRIES
-- ==================================
INSERT INTO country (name, iso_code, emergency_number) VALUES
('Portugal', 'PT', '112'),
('Spain', 'ES', '112'),
('France', 'FR', '112'),
('United States', 'US', '911');

-- ==================================
-- INSERT DEVICES
-- ==================================
INSERT INTO device
(user_id, country_id, name, serial_number, address, postal_code, located_at)
VALUES
(1, 1, 'Kitchen Sensor', 'GSF-KIT-001', 'Rua das Flores 123', '4000-123', 'Kitchen'),
(1, 1, 'Garage Sensor', 'GSF-GAR-002', 'Rua das Flores 123', '4000-123', 'Garage'),
(2, 2, 'Boiler Room Sensor', 'GSF-BLR-003', 'Calle Mayor 45', '28013', 'Basement'),
(4, 4, 'Apartment Sensor', 'GSF-APT-004', '742 Evergreen Terrace', '62704', 'Living Room');

-- ==================================
-- INSERT NOTIFICATION TYPES
-- ==================================
INSERT INTO notification_type (name) VALUES
('Important'),
('Regular');

-- ==================================
-- INSERT NOTIFICATIONS
-- ==================================
INSERT INTO notification (user_id, type_id, title, body, read_at) VALUES
(1, 1, 'Welcome to Gasify', 'Your account has been created successfully.', NOW() - INTERVAL 1 DAY),
(1, 2, 'Weekly Tips', 'Remember to check your gas usage weekly.', NULL),
(2, 1, 'Account Verification', 'Please verify your email to activate your account.', NULL),
(4, 2, 'Regular Update', 'This is a regular notification about your account.', NOW() - INTERVAL 2 HOUR);

-- ==================================
-- INSERT PASSWORD RESET CODES
-- ==================================
INSERT INTO password_reset_code (user_id, code, expires_at, used_at) VALUES
(1, 'A1B2C3', NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 10 MINUTE),
(1, 'D4E5F6', NOW() + INTERVAL 10 MINUTE, NULL),
(2, 'G7H8I9', NOW() + INTERVAL 5 MINUTE, NULL),
(4, 'J0K1L2', NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 15 MINUTE);

-- ==================================
-- INSERT READINGS
-- ==================================
INSERT INTO readings (device_id, gas_type, humidity, temperature, mq2, mq5) VALUES
(1, 'LPG', 45.20, 22.80, 120, 95),
(1, 'LPG', 48.10, 23.40, 380, 310),
(2, 'Methane', 52.00, 21.10, 620, 580),
(3, 'CO', 40.00, 19.50, 90, 70),
(4, 'Smoke', 60.30, 25.90, 710, 690);

-- ==================================
-- INSERT MCU DETECTIONS
-- ==================================
INSERT INTO mcu_detection (readings_id, canceled) VALUES
(2, FALSE),
(3, FALSE),
(5, TRUE);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
