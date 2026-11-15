-- Catalog (link) apps: runnable demo URL + how to access it (accounts, VPN, browser…)
ALTER TABLE apps ADD COLUMN demo_url TEXT;
ALTER TABLE apps ADD COLUMN access_guide TEXT;
ALTER TABLE apps ADD COLUMN access_private INTEGER NOT NULL DEFAULT 0; -- 1 = guide shown only to signed-in users
