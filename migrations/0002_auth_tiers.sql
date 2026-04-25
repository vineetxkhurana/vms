-- Migration 0002: User tiers, OTP auth, D1 rate limits, tiered product pricing

-- ─── 1. Rebuild users table (D1 doesn't support DROP COLUMN / ALTER COLUMN) ──
CREATE TABLE users_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  password_hash TEXT,          -- nullable: OTP-only users need no password
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer','retailer','wholesaler','staff','admin')),
  is_verified   INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO users_new (id, email, password_hash, name, role, is_verified, created_at)
  SELECT id, email, password_hash, name, role, 1, created_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ─── 2. OTP table ─────────────────────────────────────────────────────────────
CREATE TABLE otps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier   TEXT    NOT NULL,               -- email address or phone number
  code         TEXT    NOT NULL,
  type         TEXT    NOT NULL DEFAULT 'login'
               CHECK (type IN ('login','register','reset')),
  expires_at   INTEGER NOT NULL,               -- unix epoch seconds
  used         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_otps_identifier ON otps(identifier);

-- ─── 3. Persistent rate limits (replaces in-memory Map) ───────────────────────
CREATE TABLE rate_limits (
  key      TEXT    PRIMARY KEY,
  count    INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL               -- unix epoch seconds
);

-- ─── 4. Tiered pricing columns on products ────────────────────────────────────
ALTER TABLE products ADD COLUMN price_retailer   INTEGER; -- null → falls back to price
ALTER TABLE products ADD COLUMN price_wholesaler INTEGER; -- null → falls back to price
