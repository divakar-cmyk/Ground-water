-- Database Schema for Real-Time Groundwater Resource Evaluation System

-- Table: stations
CREATE TABLE IF NOT EXISTS stations (
  station_id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_name VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  aquifer_type VARCHAR(50),
  critical_threshold_m DECIMAL(6,2) NOT NULL,
  safe_decline_limit DECIMAL(6,3) NOT NULL,
  installed_date DATE,
  is_active BOOLEAN DEFAULT 1
);

-- Table: water_level_readings
CREATE TABLE IF NOT EXISTS water_level_readings (
  reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INT NOT NULL,
  water_level_m DECIMAL(6,2) NOT NULL,
  recorded_at DATETIME NOT NULL,
  data_quality VARCHAR(20) DEFAULT 'good', -- 'good', 'anomalous', 'interpolated'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(station_id),
  CHECK (data_quality IN ('good', 'anomalous', 'interpolated'))
);

-- Table: trend_analysis
CREATE TABLE IF NOT EXISTS trend_analysis (
  analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INT NOT NULL,
  period VARCHAR(20),
  avg_level DECIMAL(6,2),
  decline_rate DECIMAL(6,3),
  status VARCHAR(20) DEFAULT 'normal', -- 'normal', 'warning', 'critical'
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(station_id),
  CHECK (status IN ('normal', 'warning', 'critical'))
);

-- Table: alerts
CREATE TABLE IF NOT EXISTS alerts (
  alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INT NOT NULL,
  alert_type VARCHAR(50),
  message TEXT,
  severity VARCHAR(20) DEFAULT 'warning', -- 'warning', 'critical'
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT 0,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (station_id) REFERENCES stations(station_id),
  CHECK (severity IN ('warning', 'critical'))
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer', -- 'admin', 'researcher', 'viewer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (role IN ('admin', 'researcher', 'viewer'))
);
