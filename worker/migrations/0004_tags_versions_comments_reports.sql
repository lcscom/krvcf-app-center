-- v7: tags, version history, public reviews (comments), reports
ALTER TABLE apps ADD COLUMN tags TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE apps ADD COLUMN changelog TEXT;

-- one row per source version (HTML body itself lives in KV as html:<id>:v<version>)
CREATE TABLE IF NOT EXISTS app_versions (
  app_id  TEXT NOT NULL,
  version INTEGER NOT NULL,
  ts      INTEGER NOT NULL,
  actor   TEXT,
  type    TEXT NOT NULL,
  url     TEXT,
  size    INTEGER NOT NULL DEFAULT 0,
  note    TEXT,
  PRIMARY KEY (app_id, version)
);

-- public reviews: one per visitor per app (stars mirrored in ratings)
CREATE TABLE IF NOT EXISTS comments (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id   TEXT NOT NULL,
  voter    TEXT NOT NULL,
  nickname TEXT,
  stars    INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body     TEXT NOT NULL DEFAULT '',
  ts       INTEGER NOT NULL,
  hidden   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (app_id, voter)
);
CREATE INDEX IF NOT EXISTS idx_comments_app ON comments(app_id, ts);

-- abuse reports
CREATE TABLE IF NOT EXISTS reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id     TEXT NOT NULL,
  reason     TEXT NOT NULL,
  detail     TEXT,
  ip         TEXT,
  ts         INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  handled_by TEXT,
  handled_at INTEGER,
  note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, ts);

-- existing apps start at version 1
INSERT OR IGNORE INTO app_versions (app_id, version, ts, actor, type, url, size, note)
  SELECT id, 1, updated_at, author_name, type, url, size, 'initial' FROM apps;
