## Context

The Games page is currently a stub returning "coming soon." The backend has no user profile table, no game storage, and no chess.com integration. The frontend has solid reusable primitives: `useGameHistory` (PGN loading + move navigation), `usePositionEvaluation` (Stockfish WASM worker), `EvaluationBar`, and the 4-column `BrowseTab` grid layout. This change wires those primitives to real game data synced from chess.com's public API.

## Goals / Non-Goals

**Goals:**
- Store chess.com username per user in a `user_profiles` table
- Sync all-time game history on first sync; only current month on subsequent syncs
- Paginate chess.com archive months at ≤1 req/sec to avoid rate limiting
- Expose game list endpoint with filters (result, color, time class, ECO)
- Render Games tab with game list, read-only board replay, move list, eval bar

**Non-Goals:**
- Engine move classification (blunders, mistakes, inaccuracies) — Change 2
- Per-game accuracy percentage — Change 2
- Game annotations or notes
- Lichess integration
- Scheduled/automatic background sync

## Decisions

### 1. Sync runs as FastAPI `BackgroundTasks`, not Arq

**Decision**: Use FastAPI's built-in `BackgroundTasks` for the sync job rather than the existing Arq/Redis queue.

**Rationale**: Sync is user-triggered and its duration is bounded (~60s for a large initial sync at 1 req/sec). It doesn't need retry logic, scheduling, or worker scaling. Arq adds operational overhead (worker process, Redis) that isn't justified for a single on-demand job. `BackgroundTasks` runs in the same process after the response is sent — sufficient here.

**Trade-off**: If the server restarts mid-sync, progress is lost and the user must re-trigger. Acceptable given incremental sync via `synced_months` — a re-triggered sync resumes from where it left off (skips already-synced months).

**Alternative considered**: Arq queue. Rejected because the sync payload is small, retries aren't needed, and we'd need a separate worker process.

### 2. Incremental sync via `synced_months` table

**Decision**: Track each `(user_id, year, month)` tuple in a `synced_months` table. Initial sync fetches all months in chess.com archives not yet in this table. Subsequent syncs only fetch the current calendar month (new games may have been added since last sync).

**Rationale**: Avoids re-fetching hundreds of API pages on every sync. Re-syncing the current month handles games played since the last sync without complex cursor/timestamp logic.

**Trade-off**: If a past month's games are retroactively corrected on chess.com (rare), they won't be re-synced. Acceptable for this use case.

### 3. `result` stored from user's perspective

**Decision**: Store `result` as `"win" | "loss" | "draw"` derived at import time (not raw `"1-0"/"0-1"/"1/2-1/2"`), based on which side the user played.

**Rationale**: Every query and filter in the UI is from the user's perspective. Pre-deriving avoids repeated runtime computation and keeps SQL filters simple.

**Alternative considered**: Store raw result + derive in queries. Rejected — more complex queries, no benefit.

### 4. Board replay reuses `useGameHistory`, not a new hook

**Decision**: The Games tab board replay is driven by the existing `useGameHistory` hook (load PGN → get moves array + navigate by index). No new replay hook.

**Rationale**: `useGameHistory` already handles PGN loading, move parsing, index navigation, keyboard arrows, and FEN derivation. Creating a parallel hook would be duplication.

**Trade-off**: `useGameHistory` exposes some state that the games tab won't use (e.g., `interactive` flag, `gameMetadata`). Acceptable — hooks are not public APIs.

### 5. Eval bar in replay reuses `usePositionEvaluation`

**Decision**: Pass the current replay FEN to the existing `usePositionEvaluation` hook. Show `EvaluationBar` beside the board.

**Rationale**: The hook already handles Stockfish WASM lifecycle, debouncing, and stop/go sequencing. The games tab gets per-position evaluation for free by reusing it.

**Trade-off**: This evaluates only the current position on-demand, not pre-computed analysis of all moves. Full game analysis (eval graph across all moves) is Change 2.

### 6. chess.com username stored in `user_profiles`, prompted on first visit

**Decision**: `user_profiles` is a new table with `user_id` PK (matching auth token sub), `chess_com_username`, `sync_status` (`idle | running | done | error`), `last_sync_at`. The Games tab checks for a profile on mount; if `chess_com_username` is null, renders a setup prompt instead of the game list.

**Rationale**: Storing the username in the DB (not localStorage) lets the backend drive syncs without the frontend passing it each time. First-run prompt inside the tab is lower friction than a settings page detour.

## Risks / Trade-offs

**chess.com API availability** → Mitigation: wrap all fetches in try/except; set `sync_status = "error"` with a message; surface error in the UI sync status banner.

**Large initial sync duration** → Mitigation: return 202 immediately; frontend polls `GET /games/sync/status` every 2s and shows progress (`{current_month, total_months, games_added}`). Store progress in `user_profiles.sync_progress` JSON column.

**Duplicate games on re-sync** → Mitigation: `games` table has `UNIQUE(user_id, chess_com_id)`; sync uses `INSERT ... ON CONFLICT DO NOTHING`.

**`BackgroundTasks` lost on server restart** → Mitigation: `sync_status` persists in DB; re-triggering sync skips already-synced months, so no data is lost — only time is wasted re-fetching the current month.

## Migration Plan

1. Add Alembic migration: create `user_profiles`, `games`, `synced_months` tables
2. Deploy backend with new endpoints
3. Regenerate frontend API client (`npm run gen:api`)
4. Deploy frontend with new Games tab

No data migration needed (all tables are new). Rollback: drop the three new tables; revert frontend to stub.

## Open Questions

- Should `sync_progress` be a JSON column on `user_profiles` or a separate table? JSON column is simpler for now; migrate later if needed.
- Rate limit: chess.com docs say "be reasonable." 1 req/sec is standard practice for their API. Increase to 2/sec if initial sync feels too slow?
