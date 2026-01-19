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
  `user_id` BIGINT UNSIGNED NULL,
  `country_id` SMALLINT UNSIGNED NULL,
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
    ON DELETE SET NULL,
  CONSTRAINT `fk_device_country`
    FOREIGN KEY (`country_id`)
    REFERENCES `country` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE UNIQUE INDEX `ux_device_serial` ON `device` (`serial_number`);
CREATE INDEX `idx_device_user` ON `device` (`user_id`);
CREATE INDEX `idx_device_country` ON `device` (`country_id`);

-- ==================================
-- NOTIFICATION TABLE
-- ==================================
CREATE TABLE `notification` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `mcu_detection_id` BIGINT UNSIGNED NOT NULL,
  `alert_state` ENUM('ALERT_ON','ALERT_OFF', 'ALERT_PENDING') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notification_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notification_mcu_detection`
    FOREIGN KEY (`mcu_detection_id`)
    REFERENCES `mcu_detection` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX `idx_notification_user` ON `notification` (`user_id`);
CREATE INDEX `idx_notification_user_created`
ON `notification` (`user_id`, `created_at`);
CREATE INDEX `idx_notification_mcu_detection`
ON `notification` (`mcu_detection_id`);

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
-- READING TABLE
-- ==================================
CREATE TABLE `reading` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` BIGINT UNSIGNED NOT NULL,
  `gas_type` ENUM('NOTHING', 'GAS', 'CO') NOT NULL,
  `humidity` DECIMAL(5,2),
  `temperature` DECIMAL(5,2),
  `mq2` SMALLINT,
  `mq5` SMALLINT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reading_device`
    FOREIGN KEY (`device_id`)
    REFERENCES `device` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `idx_reading_device`
ON `reading` (`device_id`);

-- ==================================
-- MCU DETECTION TABLE
-- ==================================
CREATE TABLE `mcu_detection` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reading_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `canceled` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mcu_detection_reading`
    FOREIGN KEY (`reading_id`)
    REFERENCES `reading` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `idx_mcu_detection_reading`
ON `mcu_detection` (`reading_id`);

-- ==================================
-- INSERT EXISTING USERS (password = 'aBc12345678!')
-- ==================================
SET @pwd := '$2b$12$6g.ScdVpJSzGeICAfHfxAu9ulKX9W1mSD4sV4L0nUB/wQXS9gzEsC';

INSERT INTO user (full_name, email, password_hash) VALUES
('Alice Johnson', 'alice.johnson@example.com', @pwd),
('Bob Smith', 'bob.smith@example.com', @pwd),
('Charlie Davis', 'charlie.davis@example.com', @pwd),
('Dana Lee', 'dana.lee@example.com', @pwd);

-- ==================================
-- INSERT ADDITIONAL USERS
-- ==================================
INSERT INTO user (full_name, email, password_hash) VALUES
('Evan Thompson', 'evan.thompson@example.com', @pwd),
('Fiona Carter', 'fiona.carter@example.com', @pwd),
('George King', 'george.king@example.com', @pwd),
('Hannah Scott', 'hannah.scott@example.com', @pwd),
('Ian Wright', 'ian.wright@example.com', @pwd),
('Julia Adams', 'julia.adams@example.com', @pwd);

-- ==================================
-- INSERT COUNTRIES
-- ==================================
INSERT INTO country (name, iso_code, emergency_number) VALUES
('Alemanha', 'DE', '112'),
('Espanha', 'ES', '112'),
('Estados Unidos', 'US', '911'),
('França', 'FR', '112'),
('Itália', 'IT', '112'),
('Países Baixos', 'NL', '112'),
('Portugal', 'PT', '112');

-- ==================================
-- INSERT DEVICES
-- ==================================
INSERT INTO device (user_id, country_id, name, serial_number, address, postal_code) VALUES
(1, 1, 'Kitchen Sensor', 'GSF-KIT-001', 'Rua das Flores 123', '4000-123'),
(1, 1, 'Garage Sensor', 'GSF-GAR-002', 'Rua das Flores 123', '4000-123'),
(2, 2, 'Boiler Room Sensor', 'GSF-BLR-003', 'Calle Mayor 45', '28013'),
(4, 4, 'Apartment Sensor', 'GSF-APT-004', '742 Evergreen Terrace', '62704'),
(3, 3, 'Office Sensor', 'GSF-OFC-005', '10 Rue de la Paix', '75002'),
(5, 5, 'Living Room Sensor', 'GSF-LIV-006', '12 Main Street', '10001'),
(6, 6, 'Bedroom Sensor', 'GSF-BDR-007', '20 Berliner Strasse', '10115'),
(7, 7, 'Kitchen Sensor', 'GSF-KIT-008', '15 Via Roma', '00184');

-- ==================================
-- INSERT NOTIFICATIONS
-- ==================================
INSERT INTO notification (user_id, mcu_detection_id, alert_state) VALUES
(1, 1,  'ALERT_ON'),
(1, 2,  'ALERT_ON'),
(4, 3,  'ALERT_OFF'),
(3, 4,  'ALERT_ON'),
(5, 5,  'ALERT_OFF'),
(6, 6,  'ALERT_ON'),
(7, 7,  'ALERT_ON'),
(1, 8,  'ALERT_ON'),
(4, 9,  'ALERT_OFF'),
(1, 10, 'ALERT_ON');

-- ==================================
-- INSERT PASSWORD RESET CODES
-- ==================================
INSERT INTO password_reset_code (user_id, code, expires_at, used_at) VALUES
(1, 'A1B2C3', NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 10 MINUTE),
(1, 'D4E5F6', NOW() + INTERVAL 10 MINUTE, NULL),
(2, 'G7H8I9', NOW() + INTERVAL 5 MINUTE, NULL),
(4, 'J0K1L2', NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 15 MINUTE),
(3, 'M3N4O5', NOW() + INTERVAL 15 MINUTE, NULL),
(5, 'P6Q7R8', NOW() + INTERVAL 20 MINUTE, NULL),
(6, 'S9T0U1', NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 2 MINUTE),
(7, 'V2W3X4', NOW() + INTERVAL 30 MINUTE, NULL);

-- ==================================
-- INSERT READINGS
-- ==================================
INSERT INTO reading (id, device_id, gas_type, humidity, temperature, mq2, mq5, created_at) VALUES
(1, 1, 'GAS', 45.20, 22.80, 120, 95, NOW() - INTERVAL 2 HOUR),
(2, 1, 'GAS', 48.10, 23.40, 380, 310, NOW() - INTERVAL 50 MINUTE),
(3, 2, 'CO', 52.00, 21.10, 620, 580, NOW() - INTERVAL 3 HOUR),
(4, 3, 'CO', 40.00, 19.50, 90, 70, NOW() - INTERVAL 5 DAY),
(5, 4, 'CO', 60.30, 25.90, 710, 690, NOW() - INTERVAL 15 MINUTE),
(6, 5, 'GAS', 47.50, 22.00, 200, 180, NOW() - INTERVAL 10 MINUTE),
(7, 6, 'CO', 50.10, 21.50, 600, 570, NOW() - INTERVAL 7 DAY),
(8, 7, 'CO', 38.70, 20.30, 80, 75, NOW() - INTERVAL 20 MINUTE),
(9, 8, 'CO', 62.40, 26.10, 720, 700, NOW() - INTERVAL 1 HOUR),
(10, 2, 'GAS', 49.00, 23.10, 410, 330, NOW() - INTERVAL 30 MINUTE),
(11, 4, 'CO', 65.00, 26.50, 730, 710, NOW() - INTERVAL 45 MINUTE),
(12, 1, 'GAS', 46.50, 22.90, 390, 320, NOW() - INTERVAL 25 MINUTE);

-- ==================================
-- INSERT MCU DETECTIONS
-- ==================================
INSERT INTO mcu_detection (id, reading_id, canceled, created_at) VALUES
(1, 2, FALSE, NOW() - INTERVAL 50 MINUTE),
(2, 3, FALSE, NOW() - INTERVAL 3 HOUR),
(3, 5, TRUE, NOW() - INTERVAL 15 MINUTE),
(4, 6, FALSE, NOW() - INTERVAL 10 MINUTE),
(5, 7, TRUE, NOW() - INTERVAL 7 DAY),
(6, 8, FALSE, NOW() - INTERVAL 20 MINUTE),
(7, 9, FALSE, NOW() - INTERVAL 1 HOUR),
(8, 10, FALSE, NOW() - INTERVAL 30 MINUTE),
(9, 11, TRUE, NOW() - INTERVAL 45 MINUTE),
(10, 12, FALSE, NOW() - INTERVAL 25 MINUTE);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
