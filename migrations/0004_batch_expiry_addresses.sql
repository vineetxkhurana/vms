-- Products: batch/expiry tracking fields
ALTER TABLE products ADD COLUMN batch_number TEXT;
ALTER TABLE products ADD COLUMN expiry_date TEXT;         -- ISO date: YYYY-MM
ALTER TABLE products ADD COLUMN manufactured_date TEXT;   -- ISO date: YYYY-MM

-- Delivery timeline note (metadata only — not stored in DB)

-- Customer address book
CREATE TABLE IF NOT EXISTS addresses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',   -- 'Home', 'Work', 'Other'
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pin         TEXT NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
