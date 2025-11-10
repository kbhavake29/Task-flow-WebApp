-- MySQL Schema Export for TaskFlow
-- This file contains the SQL statements to recreate the database structure in MySQL

-- Create database
CREATE DATABASE IF NOT EXISTS taskflow;
USE taskflow;

-- Create projects table
CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tasks table
CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  due_date DATE,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_project_id (project_id),
  INDEX idx_tasks_user_id (user_id),
  INDEX idx_tasks_status (status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
-- Note: Replace 'YOUR_USER_ID' with an actual user ID from your authentication system

-- INSERT INTO projects (id, user_id, name, description) VALUES
-- (UUID(), 'YOUR_USER_ID', 'Website Redesign', 'Modernize company website with new branding'),
-- (UUID(), 'YOUR_USER_ID', 'Mobile App Development', 'Build iOS and Android apps for customer portal'),
-- (UUID(), 'YOUR_USER_ID', 'Marketing Campaign', 'Q1 digital marketing initiatives');

-- INSERT INTO tasks (id, project_id, user_id, title, due_date, status) VALUES
-- (UUID(), (SELECT id FROM projects WHERE name = 'Website Redesign'), 'YOUR_USER_ID', 'Design mockups', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'completed'),
-- (UUID(), (SELECT id FROM projects WHERE name = 'Website Redesign'), 'YOUR_USER_ID', 'Implement frontend', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'pending');
