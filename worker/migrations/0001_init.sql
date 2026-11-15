-- KRVCF App Center : initial schema
CREATE TABLE IF NOT EXISTS apps (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK (type IN ('link','html')),
  name            TEXT NOT NULL,
  url             TEXT,
  category        TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  thumbnail       TEXT,
  author_name     TEXT NOT NULL,
  author_email    TEXT,
  owner_key_hash  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note     TEXT,
  featured        INTEGER NOT NULL DEFAULT 0,
  runs            INTEGER NOT NULL DEFAULT 0,
  rating_sum      INTEGER NOT NULL DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  size            INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);

CREATE TABLE IF NOT EXISTS ratings (
  app_id     TEXT NOT NULL,
  voter      TEXT NOT NULL,
  stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, voter)
);

CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id     TEXT NOT NULL,
  message    TEXT NOT NULL,
  ip         TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_app ON feedback(app_id);

CREATE TABLE IF NOT EXISTS visits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,
  ip      TEXT,
  vh      TEXT,
  country TEXT,
  path    TEXT,
  ua      TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts);

CREATE TABLE IF NOT EXISTS counters (
  k TEXT PRIMARY KEY,
  v INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ratelimit (
  k        TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
