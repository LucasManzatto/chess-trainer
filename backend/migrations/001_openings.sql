CREATE TABLE IF NOT EXISTS openings (
    id SERIAL PRIMARY KEY,
    eco VARCHAR(3) NOT NULL,
    name TEXT NOT NULL,
    pgn TEXT NOT NULL,
    fen TEXT NOT NULL,
    moves TEXT[] NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_openings_eco ON openings (eco);
CREATE INDEX IF NOT EXISTS idx_openings_name ON openings USING gin (to_tsvector('simple', name));

CREATE TABLE IF NOT EXISTS opening_comments (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    opening_id INTEGER NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opening_comments_user_opening ON opening_comments (user_id, opening_id);

CREATE TABLE IF NOT EXISTS position_comments (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    opening_id INTEGER NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
    move_index INTEGER NOT NULL,
    fen TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_comments_user_opening ON position_comments (user_id, opening_id);

CREATE TABLE IF NOT EXISTS opening_progress (
    user_id TEXT NOT NULL,
    opening_id INTEGER NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
    ease_factor FLOAT NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    repetitions INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    PRIMARY KEY (user_id, opening_id)
);

CREATE INDEX IF NOT EXISTS idx_opening_progress_user_due ON opening_progress (user_id, due_date);
