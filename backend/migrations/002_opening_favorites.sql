CREATE TABLE IF NOT EXISTS opening_favorites (
    user_id TEXT NOT NULL,
    opening_id INTEGER NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, opening_id)
);

CREATE INDEX IF NOT EXISTS idx_opening_favorites_user ON opening_favorites (user_id);
