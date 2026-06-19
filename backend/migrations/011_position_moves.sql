CREATE TABLE position_moves (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    from_position_id UUID       NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    to_position_id  UUID        NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    san             TEXT        NOT NULL,
    lan             TEXT        NOT NULL,
    is_main_line    BOOLEAN     NOT NULL DEFAULT false,
    commentary      TEXT,
    UNIQUE (from_position_id, san)
);

CREATE INDEX idx_position_moves_from ON position_moves (from_position_id);
CREATE INDEX idx_position_moves_to   ON position_moves (to_position_id);
