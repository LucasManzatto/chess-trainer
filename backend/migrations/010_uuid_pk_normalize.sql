-- Run backend/scripts/migrate_cards_to_positions.py BEFORE this migration
-- if you have existing repertoire_cards data to preserve.
-- On a fresh schema (no cards) the migration is safe without it.

-- ── positions: drop old SERIAL id, add UUID id + created_at, drop pgn ────────
ALTER TABLE positions DROP COLUMN IF EXISTS id;
ALTER TABLE positions ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE positions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE positions DROP COLUMN IF EXISTS pgn;

-- ── position_comments: add position_id, populate from fen join ────────────────
ALTER TABLE position_comments ADD COLUMN position_id UUID;
UPDATE position_comments pc
    SET position_id = p.id
    FROM positions p
    WHERE p.fen = pc.fen;
ALTER TABLE position_comments ALTER COLUMN position_id SET NOT NULL;

-- ── repertoire_cards: add position_id ────────────────────────────────────────
ALTER TABLE repertoire_cards ADD COLUMN position_id UUID;

-- Ensure mapping table exists (created by pre-migration script — no-op if absent)
CREATE TABLE IF NOT EXISTS card_position_mapping (card_id UUID, position_fen TEXT);
UPDATE repertoire_cards rc
    SET position_id = p.id
    FROM card_position_mapping m
    JOIN positions p ON p.fen = m.position_fen
    WHERE m.card_id = rc.id;

-- Fail loudly if any card was not mapped (pre-migration script needed)
ALTER TABLE repertoire_cards ALTER COLUMN position_id SET NOT NULL;

-- ── drop FK constraints referencing positions(fen) as PK ─────────────────────
ALTER TABLE position_comments DROP CONSTRAINT IF EXISTS position_comments_fen_fkey;
ALTER TABLE user_positions    DROP CONSTRAINT IF EXISTS user_positions_fen_fkey;

-- ── promote positions.id to PK, demote fen to UNIQUE NOT NULL ─────────────────
ALTER TABLE positions DROP CONSTRAINT positions_pkey;
ALTER TABLE positions ADD PRIMARY KEY (id);
ALTER TABLE positions ADD CONSTRAINT positions_fen_unique UNIQUE (fen);

-- ── re-add user_positions FK (fen is still UNIQUE) ───────────────────────────
ALTER TABLE user_positions
    ADD CONSTRAINT user_positions_fen_fkey
    FOREIGN KEY (fen) REFERENCES positions(fen) ON DELETE CASCADE;

-- ── wire position_comments to positions(id) ───────────────────────────────────
ALTER TABLE position_comments
    ADD CONSTRAINT fk_position_comments_position
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
DROP INDEX IF EXISTS idx_position_comments_user_fen;
CREATE INDEX idx_comments_position ON position_comments(position_id);
ALTER TABLE position_comments DROP COLUMN fen;

-- ── wire repertoire_cards to positions(id) ────────────────────────────────────
ALTER TABLE repertoire_cards
    ADD CONSTRAINT fk_repertoire_cards_position
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
ALTER TABLE repertoire_cards
    DROP CONSTRAINT IF EXISTS repertoire_cards_user_id_position_key_key;
ALTER TABLE repertoire_cards
    ADD CONSTRAINT rc_user_position_unique UNIQUE (user_id, position_id);
ALTER TABLE repertoire_cards RENAME COLUMN plan TO user_plan;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS position_key;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS fen;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS answer;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS line;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS opening_eco;
ALTER TABLE repertoire_cards DROP COLUMN IF EXISTS opening_name;

-- ── rebuild positions name index ─────────────────────────────────────────────
DROP INDEX IF EXISTS idx_positions_name;
CREATE INDEX idx_positions_name ON positions USING gin (to_tsvector('simple', coalesce(name, '')));

-- ── cleanup ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS card_position_mapping
