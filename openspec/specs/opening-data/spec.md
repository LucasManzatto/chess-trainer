## Requirements

### Requirement: Openings seeded from lichess-org/chess-openings dataset
A one-time seeding script SHALL download all five TSV files (a.tsv–e.tsv) from `https://raw.githubusercontent.com/lichess-org/chess-openings/master/`, parse them, compute the final FEN for each opening using `python-chess`, and insert all rows into the `openings` table in Neon.

#### Scenario: Seed script populates openings table
- **WHEN** the seed script runs against an empty database
- **THEN** the `openings` table contains 3,704 rows with non-null eco, name, pgn, fen, and moves columns

#### Scenario: Seed script emits openings.json
- **WHEN** the seed script runs
- **THEN** `frontend/public/openings.json` is created containing all openings as a JSON array

#### Scenario: Seed script handles parse failures gracefully
- **WHEN** a PGN string cannot be parsed by python-chess
- **THEN** that row is skipped with a logged warning and the script continues

### Requirement: openings table schema
The database SHALL contain an `openings` table with the following columns: `id` (serial PK), `eco` (varchar 3), `name` (text), `pgn` (text), `fen` (text, final position), `moves` (text array of SAN moves).

#### Scenario: FEN is valid for each opening
- **WHEN** querying any row in the openings table
- **THEN** the `fen` column contains a valid FEN string representing the position after all moves in `pgn`

### Requirement: SRS progress schema
The database SHALL contain an `opening_progress` table to store per-user SM-2 state.

Columns: `user_id` (text), `opening_id` (integer FK → openings.id), `ease_factor` (float, default 2.5), `interval_days` (integer, default 1), `due_date` (date, default today), `repetitions` (integer, default 0), `last_reviewed` (timestamptz nullable). Primary key: (user_id, opening_id).

#### Scenario: New progress record has correct defaults
- **WHEN** a progress record is created via "Add to Drill"
- **THEN** ease_factor=2.5, interval_days=1, due_date=today, repetitions=0

### Requirement: Comments schema
The database SHALL contain `opening_comments` and `position_comments` tables.

`opening_comments`: id (serial PK), user_id (text), opening_id (int FK), content (text), created_at (timestamptz default now).

`position_comments`: id (serial PK), user_id (text), opening_id (int FK), move_index (int), fen (text), content (text), created_at (timestamptz default now).

#### Scenario: Position comment links to move index
- **WHEN** a position comment is created for move 3 of an opening
- **THEN** the record has move_index=3 and fen matching the position after 3 moves

### Requirement: openings.json is lazy-loaded by the frontend
The frontend SHALL load `openings.json` on first access to the openings page via a dynamic import or fetch, not in the main bundle.

#### Scenario: openings.json not loaded on app start
- **WHEN** the user loads the app on any route other than /openings
- **THEN** no request for openings.json is made

#### Scenario: openings.json loaded when openings page opens
- **WHEN** the user first navigates to /openings
- **THEN** openings.json is fetched and its data is available for Browse and Explore
