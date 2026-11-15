-- v2: approvers (email/Google auth), review history, audit log, settings
ALTER TABLE apps ADD COLUMN reviewed_by TEXT;
ALTER TABLE apps ADD COLUMN reviewed_at INTEGER;

CREATE TABLE IF NOT EXISTS approvers (
  email       TEXT PRIMARY KEY,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'approver' CHECK (role IN ('approver','admin')),
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  created_by  TEXT,
  last_login  INTEGER,
  last_method TEXT,
  login_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS otp (
  email      TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  exp        INTEGER NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_reviews (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT NOT NULL,
  ts     INTEGER NOT NULL,
  actor  TEXT NOT NULL,
  action TEXT NOT NULL,
  note   TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON app_reviews(app_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,
  actor       TEXT NOT NULL,
  role        TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  detail      TEXT,
  ok          INTEGER NOT NULL DEFAULT 1,
  ip          TEXT,
  country     TEXT,
  ua          TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

CREATE TABLE IF NOT EXISTS settings (
  k          TEXT PRIMARY KEY,
  v          TEXT NOT NULL,
  updated_at INTEGER,
  updated_by TEXT
);
