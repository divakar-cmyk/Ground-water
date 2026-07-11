-- Run this once against your MySQL server before starting the Spring Boot app.
-- mysql -u root -p < init-mysql.sql

CREATE DATABASE IF NOT EXISTS groundwater_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE groundwater_db;

-- Spring Boot (ddl-auto=update) will create this table automatically,
-- but you can also create it manually here for reference.
CREATE TABLE IF NOT EXISTS stations (
    station_id    BIGINT          NOT NULL AUTO_INCREMENT,
    station_name  VARCHAR(100)    NOT NULL,
    location      VARCHAR(150),
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    aquifer_type  VARCHAR(50),
    critical_threshold_m DECIMAL(6,2) NOT NULL,   -- mapped to "depth" in the entity
    status        VARCHAR(20)     DEFAULT 'NORMAL',
    last_sync     DATETIME,
    is_active     TINYINT(1)      DEFAULT 1,
    PRIMARY KEY (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
