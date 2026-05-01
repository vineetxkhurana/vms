-- Migration 0005: Business event log for analytics
-- Tracks key funnel events: product views, cart actions, orders, registrations

CREATE TABLE IF NOT EXISTS analytics_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event       TEXT    NOT NULL,               -- 'product_view' | 'add_to_cart' | 'order_placed' | 'user_registered' | 'checkout_started'
  session_id  TEXT,                           -- anonymous browser session (no PII)
  user_id     INTEGER,                        -- NULL for anonymous
  metadata    TEXT    DEFAULT '{}',           -- JSON: product_id, order_id, amount_paise, etc.
  country     TEXT,                           -- from cf-ipcountry header
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_events_event      ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_user_id    ON analytics_events(user_id);
