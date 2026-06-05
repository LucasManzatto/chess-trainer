CREATE TABLE IF NOT EXISTS position_move_stats (
    moves TEXT[] PRIMARY KEY,
    stats JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
