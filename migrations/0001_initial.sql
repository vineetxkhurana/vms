-- Migration 0001: Initial schema for VMS Ecommerce

CREATE TABLE categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  price       INTEGER NOT NULL, -- paise (₹1 = 100 paise)
  brand       TEXT    NOT NULL DEFAULT 'other' CHECK (brand IN ('VMS','other')),
  stock       INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active    ON products(is_active);

CREATE TABLE orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  total_paise  INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT,
  address_json TEXT NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_orders_user   ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  price_paise INTEGER NOT NULL  -- snapshot at purchase time
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Seed: default categories
INSERT INTO categories (name) VALUES
  ('Medicines'),('Vitamins & Supplements'),('Skin Care'),
  ('Baby Care'),('First Aid'),('Medical Devices'),('Ayurvedic');
