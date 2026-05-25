## 1. Backend — Data Models & Migration

- [x] 1.1 Add `UserProfile` SQLAlchemy model (`user_profiles` table: `user_id` PK, `chess_com_username`, `sync_status`, `sync_progress` JSON, `last_sync_at`)
- [x] 1.2 Add `Game` SQLAlchemy model (`games` table: `id`, `user_id`, `chess_com_id`, `white_username`, `white_rating`, `black_username`, `black_rating`, `user_color`, `result`, `termination`, `time_class`, `time_control`, `eco`, `opening_name`, `moves` ARRAY, `pgn`, `played_at`; UNIQUE on `(user_id, chess_com_id)`)
- [x] 1.3 Add `SyncedMonth` SQLAlchemy model (`synced_months` table: `user_id`, `year`, `month`, `game_count`, `synced_at`; PK on `(user_id, year, month)`)
- [x] 1.4 Create SQL migration `003_games.sql` for the three new tables (project uses custom SQL migrations, not Alembic)

## 2. Backend — Schemas

- [x] 2.1 Add `UserProfileResponse` and `UserProfileUpdate` Pydantic schemas
- [x] 2.2 Add `GameResponse` Pydantic schema (all Game fields)
- [x] 2.3 Add `GamesListResponse` schema (`items: list[GameResponse]`, `total: int`)
- [x] 2.4 Add `SyncStatusResponse` schema (`status`, `current_month`, `total_months`, `games_added`, `last_sync_at`)

## 3. Backend — GameSyncService

- [x] 3.1 Create `src/app/services/games_sync.py` with `GameSyncService` class
- [x] 3.2 Implement `fetch_archives(username)` — GET chess.com archives endpoint, return list of month URLs
- [x] 3.3 Implement `fetch_month_games(url)` — GET one month URL, parse PGN headers, return list of parsed game dicts
- [x] 3.4 Implement PGN parser: extract `white`, `black`, `whiteelo`, `blackelo`, `result`, `termination`, `timecontrol`, `eco`, `opening`, `utcdatetime`/`endtime`, `moves[]` from chess.com PGN headers and move text
- [x] 3.5 Implement `derive_user_fields(game_dict, username)` — set `user_color` and `result` from user's perspective
- [x] 3.6 Implement `run_sync(user_id, username, db)` — fetch archives, determine which months to sync (all vs current only), iterate with `asyncio.sleep(1)` between requests, upsert games with `ON CONFLICT DO NOTHING`, update `synced_months` and `user_profiles.sync_progress` after each month

## 4. Backend — API Endpoints

- [x] 4.1 Create `src/app/api/v1/profile.py` router with `GET /users/profile` (auto-create if missing) and `PATCH /users/profile`
- [x] 4.2 Create `src/app/api/v1/games.py` router with `POST /games/sync` (202 + BackgroundTask, 409 if running, 400 if no username)
- [x] 4.3 Add `GET /games/sync/status` endpoint returning `SyncStatusResponse`
- [x] 4.4 Add `GET /games` endpoint with query params `result`, `color`, `time_class`, `eco`, `limit`, `offset`; filter and paginate `games` table
- [x] 4.5 Register both new routers in `main.py`

## 5. Frontend — API Client & Types

- [x] 5.1 N/A — project uses `request()` directly, not generated client (no gen:api step needed)
- [x] 5.2 Create `src/features/games/types/index.ts` with `Game`, `UserProfile`, `SyncStatus`, `GamesFilters` types

## 6. Frontend — API Hooks

- [x] 6.1 Create `src/features/games/api/index.ts` with `getProfile`, `updateProfile`, `triggerSync`, `getSyncStatus`, `getGames` API calls
- [x] 6.2 Create `src/features/games/api/queryKeys.ts`
- [x] 6.3 Create `src/features/games/hooks/useProfile.ts` — TanStack Query hook for user profile
- [x] 6.4 Create `src/features/games/hooks/useGamesSync.ts` — mutation to trigger sync + polling `getSyncStatus` every 2s while `status === "running"`
- [x] 6.5 Create `src/features/games/hooks/useGames.ts` — TanStack Query hook for games list with filter params

## 7. Frontend — GamesList Component

- [x] 7.1 Create `src/features/games/components/GamesList/GamesList.tsx` — scrollable list of game rows
- [x] 7.2 Create `GameRow` sub-component: result badge (W/L/D colored), opponent name + rating, opening name, time control icon, formatted date; highlight selected row
- [x] 7.3 Add filter controls in `GamesList` header: result toggle (W/L/D/all), color toggle (white/black/both), time class select, ECO text input
- [x] 7.4 Create `src/features/games/components/GamesList/useGamesList.ts` — filter state management

## 8. Frontend — First-Run Setup Prompt

- [x] 8.1 Create `src/features/games/components/ChessComSetup.tsx` — prompt with text input for chess.com username and submit button
- [x] 8.2 On submit, call `PATCH /users/profile` then invalidate profile query; transition to full games tab on success

## 9. Frontend — GamesTab & useGamesTab

- [x] 9.1 Create `src/features/games/hooks/useGamesTab.ts` — combine `useProfile`, `useGames`, `useGamesSync`, game selection state, filter state; load selected game into `useGameHistory` via `loadFromPgn`
- [x] 9.2 Create `src/features/games/components/GamesTab/GamesTab.tsx` — 4-column layout matching BrowseTab grid: `[280px_1fr_220px_260px]`; col 1 = GamesList, col 2 = board + eval bar + controls, col 3 = MoveList, col 4 = analysis placeholder panel
- [x] 9.3 Wire board orientation to `user_color` of selected game (white-on-bottom for white games, black-on-bottom for black games)
- [x] 9.4 Pass current replay FEN to `usePositionEvaluation`; render `EvaluationBar` beside board
- [x] 9.5 Show empty-state placeholder in board column when no game selected ("Select a game to replay")
- [x] 9.6 Add sync button + progress indicator in GamesTab header (show `current_month/total_months` while running)

## 10. Frontend — Route Wiring

- [x] 10.1 Update `src/app/routes/_auth/games/index.tsx` — check profile; render `ChessComSetup` if no username, else render `GamesTab`
