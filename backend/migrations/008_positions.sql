-- Create positions table (replaces openings)
CREATE TABLE IF NOT EXISTS positions (
    fen TEXT PRIMARY KEY,
    eco VARCHAR(10),
    name TEXT,
    pgn TEXT,
    moves TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_positions_eco ON positions (eco);
CREATE INDEX IF NOT EXISTS idx_positions_name ON positions USING gin (to_tsvector('simple', coalesce(name, '')));

-- Migrate existing openings data
INSERT INTO positions (fen, eco, name, pgn, moves)
SELECT fen, eco, name, pgn, moves FROM openings
ON CONFLICT (fen) DO NOTHING;

-- Create user_positions table (replaces opening_favorites)
CREATE TABLE IF NOT EXISTS user_positions (
    user_id TEXT NOT NULL,
    fen TEXT NOT NULL REFERENCES positions(fen) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, fen)
);

CREATE INDEX IF NOT EXISTS idx_user_positions_user ON user_positions (user_id);

-- Migrate existing favorites (join opening_id → fen)
INSERT INTO user_positions (user_id, fen, saved_at)
SELECT f.user_id, o.fen, NOW()
FROM opening_favorites f
JOIN openings o ON o.id = f.opening_id
ON CONFLICT DO NOTHING;

-- Drop old position_comments and recreate keyed by fen
DROP TABLE IF EXISTS position_comments;
DROP TABLE IF EXISTS opening_comments;

CREATE TABLE IF NOT EXISTS position_comments (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fen TEXT NOT NULL REFERENCES positions(fen) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_comments_user_fen ON position_comments (user_id, fen);

-- Drop old tables
DROP TABLE IF EXISTS opening_progress;
DROP TABLE IF EXISTS opening_favorites;
DROP TABLE IF EXISTS openings
