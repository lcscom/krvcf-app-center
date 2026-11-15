-- v9: in-app notifications, owner replies to reviews, account-synced favorites,
--     approved-version tracking (for change review) and link health checks
CREATE TABLE IF NOT EXISTS notifications (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  email   TEXT NOT NULL,
  kind    TEXT NOT NULL,
  app_id  TEXT,
  data    TEXT,
  ts      INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(email, id DESC);

ALTER TABLE comments ADD COLUMN reply TEXT;
ALTER TABLE comments ADD COLUMN reply_ts INTEGER;

CREATE TABLE IF NOT EXISTS user_favs (
  email  TEXT NOT NULL,
  app_id TEXT NOT NULL,
  ts     INTEGER NOT NULL,
  PRIMARY KEY (email, app_id)
);

ALTER TABLE apps ADD COLUMN approved_version INTEGER;
UPDATE apps SET approved_version = version WHERE status = 'approved';

ALTER TABLE apps ADD COLUMN link_status TEXT;      -- 'ok' | 'broken' | NULL (not checked)
ALTER TABLE apps ADD COLUMN link_checked_at INTEGER;
ALTER TABLE apps ADD COLUMN link_error TEXT;
ALTER TABLE apps ADD COLUMN link_fails INTEGER NOT NULL DEFAULT 0; -- consecutive failed checks
