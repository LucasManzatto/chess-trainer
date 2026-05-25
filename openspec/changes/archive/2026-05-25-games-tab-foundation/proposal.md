## Why

The Games page is a placeholder stub. Users need to sync their chess.com game history into the app and replay games with an eval bar — the foundation for future engine analysis, opening stats, and blunder review.

## What Changes

- Add `UserProfile` table to store chess.com username and sync state per user
- Add `Game` table storing all PGN-derived fields (players, result, ECO, moves array, played_at)
- Add `SyncedMonth` table tracking which year/month combinations have been fetched, enabling incremental sync
- Add `GameSyncService`: fetches chess.com archives list, paginates through months at 1 req/sec, upserts games
- Add backend endpoints: user profile CRUD, sync trigger (202 + background task), sync status polling, games list with filters
- Replace Games page stub with full 4-column layout: GamesList | Board (read-only replay) | MoveList | placeholder analysis panel
- First-run prompt inside Games tab when no chess.com username is set
- Eval bar shown during game replay (reuses existing `usePositionEvaluation` + `EvaluationBar`)

## Capabilities

### New Capabilities

- `user-profile`: Store and retrieve per-user profile data (chess.com username); required by sync and future personalization features
- `games-sync`: Fetch and persist a user's chess.com game history with rate-limited incremental sync
- `games-list`: Browse, filter, and select from synced games (by result, color, time class, ECO)
- `game-replay`: Replay any synced game on an interactive board with move navigation and eval bar

### Modified Capabilities

- `games-page`: Replace stub with full Games tab layout

## Impact

- **Backend**: 3 new models + migrations (`user_profiles`, `games`, `synced_months`); new `GameSyncService`; new router `api/v1/games.py`; new router `api/v1/profile.py`; `httpx` for chess.com API calls (already in deps or add)
- **Frontend**: New `features/games/` feature folder; `GamesTab` layout reusing `BrowseTab` grid pattern; `useGamesTab` hook; `GamesList` component; `useGamesSync` hook; first-run `ChessComSetup` prompt
- **API**: `GET/PATCH /users/profile`, `POST /games/sync`, `GET /games/sync/status`, `GET /games`
- **Dependencies**: `httpx` on backend (async chess.com fetching); no new frontend deps (stockfish + chess.js already present)
