## Why

The `/openings` route currently renders a placeholder. Chess opening knowledge is foundational to improvement, and a dedicated page covering browse, exploration, and spaced-repetition drilling — with personal annotations — turns the app into a serious study tool.

## What Changes

- Replace the placeholder `/openings` page with a full three-tab interface: **Browse**, **Explore**, **Drill**
- Seed Neon DB with 3,704 openings from the [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) dataset (ECO A–E)
- Add four new DB tables: `openings`, `opening_comments`, `position_comments`, `opening_progress`
- Add FastAPI endpoints for comments CRUD and SRS drill queue/review
- Add a one-time Python seeding script that downloads TSVs, computes FEN via `python-chess`, and emits `openings.json`
- Load all 3,704 openings client-side (lazy JSON, ~50 KB gzipped); Browse filtering and Explore trie run in-browser
- Implement SM-2 spaced repetition for Drill mode; progress stored per-user in Neon
- Private per-user comments on both the opening as a whole and on individual moves

## Capabilities

### New Capabilities

- `opening-browse`: Search and filter all 3,704 openings by name/ECO; select one to see board position and move list
- `opening-explore`: Interactive board with next-move explorer — highlights candidate moves with opening counts; narrows as user plays
- `opening-drill`: SRS drill queue powered by SM-2; user plays correct moves from memory and grades themselves
- `opening-comments`: Private per-user annotations on an opening (whole line) or on a specific move within it
- `opening-data`: DB schema, seeding pipeline, and lazy-loaded JSON for the lichess openings dataset

### Modified Capabilities

- `openings-page`: Existing spec only requires a placeholder route. Requirements now expand to the full feature set described above.

## Impact

- **Frontend**: New components under `src/features/openings/` — tabs, trie engine, drill UI, comment widgets; reuses `ChessBoard`, `MoveList`, existing auth guard
- **Backend**: New router `backend/src/app/api/v1/openings.py`; new models; new seeding script `backend/scripts/seed_openings.py`
- **Database**: Four new Neon tables; one-time migration
- **Dependencies**: `python-chess` added to backend requirements; no new frontend deps
- **Auth**: Browse + Explore are public; Comments + Drill require login (existing `_auth` guard)
