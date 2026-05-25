CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    chess_com_username TEXT,
    sync_status VARCHAR(16) NOT NULL DEFAULT 'idle',
    sync_progress JSONB,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    chess_com_id TEXT NOT NULL,
    white_username TEXT NOT NULL,
    white_rating INTEGER,
    black_username TEXT NOT NULL,
    black_rating INTEGER,
    user_color VARCHAR(8) NOT NULL,
    result VARCHAR(8) NOT NULL,
    termination TEXT,
    time_class VARCHAR(16),
    time_control TEXT,
    eco VARCHAR(4),
    opening_name TEXT,
    moves TEXT[] NOT NULL,
    pgn TEXT NOT NULL,
    played_at TIMESTAMPTZ,
    CONSTRAINT uq_games_user_chess_com UNIQUE (user_id, chess_com_id)
);

CREATE INDEX IF NOT EXISTS idx_games_user_id ON games (user_id);
CREATE INDEX IF NOT EXISTS idx_games_played_at ON games (played_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_user_result ON games (user_id, result);
CREATE INDEX IF NOT EXISTS idx_games_user_color ON games (user_id, user_color);
CREATE INDEX IF NOT EXISTS idx_games_user_time_class ON games (user_id, time_class);
CREATE INDEX IF NOT EXISTS idx_games_user_eco ON games (user_id, eco);

CREATE TABLE IF NOT EXISTS synced_months (
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    game_count INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, year, month)
);
