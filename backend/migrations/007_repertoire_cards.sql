CREATE TABLE repertoire_cards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  position_key  TEXT        NOT NULL,
  fen           TEXT        NOT NULL,
  side          TEXT        NOT NULL CHECK (side IN ('white', 'black')),
  answer        TEXT        NOT NULL,
  line          TEXT[]      NOT NULL DEFAULT '{}',
  opening_eco   TEXT,
  opening_name  TEXT,
  plan          TEXT,
  ease          FLOAT       NOT NULL DEFAULT 2.5,
  interval_days FLOAT       NOT NULL DEFAULT 1,
  due           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reps          INTEGER     NOT NULL DEFAULT 0,
  lapses        INTEGER     NOT NULL DEFAULT 0,
  state         TEXT        NOT NULL DEFAULT 'new'
                            CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, position_key)
);

CREATE INDEX ON repertoire_cards (user_id, due);
