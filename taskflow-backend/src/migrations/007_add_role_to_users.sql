-- Migration: Add role field to users table
-- This enables role-based access control (RBAC) with admin and user roles
ALTER TABLE users
ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER email_verified,
ADD INDEX idx_users_role (role),
COMMENT = 'Users table with role-based access control';
