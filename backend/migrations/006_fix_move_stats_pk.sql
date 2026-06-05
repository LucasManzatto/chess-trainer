-- Recreate with surrogate PK (TEXT[] is unhashable, breaks SQLAlchemy identity map)
DROP TABLE IF EXISTS position_move_stats;

CREATE TABLE position_move_stats (
    id SERIAL PRIMARY KEY,
    moves TEXT[] NOT NULL UNIQUE,
    stats JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_position_move_stats_moves ON position_move_stats USING GIN (moves);
