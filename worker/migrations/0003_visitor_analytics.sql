-- v3: visitor analytics (daily UV/PV, live presence, referrers/devices), app views
ALTER TABLE apps ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE visits ADD COLUMN ref TEXT;
ALTER TABLE visits ADD COLUMN device TEXT;
ALTER TABLE visits ADD COLUMN browser TEXT;
ALTER TABLE visits ADD COLUMN app_id TEXT;
CREATE INDEX IF NOT EXISTS idx_visits_vh ON visits(vh);

-- all-time unique visitors
CREATE TABLE IF NOT EXISTS visitors (
  vh       TEXT PRIMARY KEY,
  first_ts INTEGER NOT NULL,
  last_ts  INTEGER NOT NULL,
  pv       INTEGER NOT NULL DEFAULT 0,
  country  TEXT,
  device   TEXT
);
CREATE INDEX IF NOT EXISTS idx_visitors_last ON visitors(last_ts);

-- daily aggregates (kept permanently, KST days)
CREATE TABLE IF NOT EXISTS daily (
  day       TEXT PRIMARY KEY,
  pv        INTEGER NOT NULL DEFAULT 0,
  uv        INTEGER NOT NULL DEFAULT 0,
  new_uv    INTEGER NOT NULL DEFAULT 0,
  app_views INTEGER NOT NULL DEFAULT 0,
  runs      INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS daily_seen (
  day TEXT NOT NULL,
  vh  TEXT NOT NULL,
  PRIMARY KEY (day, vh)
);

-- per-app daily views/runs
CREATE TABLE IF NOT EXISTS app_daily (
  app_id TEXT NOT NULL,
  day    TEXT NOT NULL,
  views  INTEGER NOT NULL DEFAULT 0,
  runs   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, day)
);

-- live presence (heartbeat)
CREATE TABLE IF NOT EXISTS presence (
  vh   TEXT PRIMARY KEY,
  ts   INTEGER NOT NULL,
  path TEXT
);
CREATE INDEX IF NOT EXISTS idx_presence_ts ON presence(ts);

-- backfill aggregates from existing visit logs
INSERT OR IGNORE INTO daily (day, pv, uv)
  SELECT strftime('%Y-%m-%d', (ts / 1000) + 32400, 'unixepoch'), COUNT(*), COUNT(DISTINCT vh) FROM visits GROUP BY 1;
INSERT OR IGNORE INTO visitors (vh, first_ts, last_ts, pv)
  SELECT vh, MIN(ts), MAX(ts), COUNT(*) FROM visits WHERE vh IS NOT NULL GROUP BY vh;
