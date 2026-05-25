## Why

Players reviewing their games have no way to identify blunders, mistakes, or inaccuracies — they must rely on visual inspection alone. Full game analysis with move classification and accuracy scoring closes this gap and makes the Games tab genuinely useful for improvement.

## What Changes

- New **Analyze Game** button in the Games tab that triggers full in-browser Stockfish WASM analysis of the selected game
- Progress bar showing analysis status (e.g. "14/61 positions")
- **Re-analyze** button when analysis already exists for a game
- Move list colored by classification: green (best/excellent), yellow (good/inaccuracy), red (mistake/blunder)
- Accuracy badges in the games list row (e.g. "87% / 82%")
- Backend stores analysis as JSONB on the Game record
- New `PUT /api/v1/games/{id}/analysis` endpoint

## Capabilities

### New Capabilities
- `game-analysis`: Full game analysis using Stockfish WASM — sequential position evaluation, per-move classification (best/excellent/good/inaccuracy/mistake/blunder), accuracy computation, persistence to backend, and UI feedback in move list and games list

### Modified Capabilities
- `games-list`: Accuracy badges added to game rows when analysis exists
- `move-list`: Move coloring by classification added as optional display mode

## Impact

- **Backend**: New `analysis` JSONB column on `games` table, Alembic migration, new endpoint, updated schema
- **Frontend**: New `useGameAnalysis` hook, updated `MoveList`, updated `GamesList`, updated `GamesTab` + `useGamesTab`
- **Dependencies**: No new packages — reuses existing `stockfish` npm package
