-- v8: Google-account ownership for submitted apps + creator accounts
-- Apps submitted from v8 on are owned by the signed-in Google account (owner_email).
-- Older apps keep owner_key_hash and can be linked to an account from the Owner Studio ("Link existing app").
ALTER TABLE apps ADD COLUMN owner_email TEXT;
CREATE INDEX IF NOT EXISTS idx_apps_owner ON apps(owner_email);

CREATE TABLE IF NOT EXISTS users (
  email        TEXT PRIMARY KEY,
  name         TEXT,
  picture      TEXT,
  created_at   INTEGER NOT NULL,
  last_login   INTEGER,
  login_count  INTEGER NOT NULL DEFAULT 0,
  blocked      INTEGER NOT NULL DEFAULT 0,
  blocked_note TEXT
);
