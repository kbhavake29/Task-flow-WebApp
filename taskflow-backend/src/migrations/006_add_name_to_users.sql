-- Add name field to users table with index
ALTER TABLE users
ADD COLUMN name VARCHAR(255) NULL AFTER email,
ADD INDEX idx_name (name);
