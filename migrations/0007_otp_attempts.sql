-- Add attempt counter to OTPs for brute-force protection
ALTER TABLE otps ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
