-- Screenshots: JSON array of {"url": "...", "caption": "..."} (uploaded images are served from /img/<id>)
ALTER TABLE apps ADD COLUMN screenshots TEXT;
