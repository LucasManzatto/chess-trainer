## 1. Backend — Data Model & Migration

- [x] 1.1 Add `analysis: Mapped[dict | None] = mapped_column(JSONB, nullable=True)` to `Game` model in `backend/src/app/models/games.py`
- [x] 1.2 Generate Alembic migration: `alembic revision --autogenerate -m "add analysis column to games"`
- [x] 1.3 Add `GameAnalysisCreate` Pydantic schema (moves, white_accuracy, black_accuracy, depth, analyzed_at)
- [x] 1.4 Add `analysis: dict | None` field to `GameResponse` schema

## 2. Backend — API Endpoint

- [x] 2.1 Add `PUT /api/v1/games/{id}/analysis` route in `backend/src/app/api/v1/games.py`
- [x] 2.2 Implement service method `save_game_analysis(game_id, user_id, analysis)` in `games.py` service — verify game belongs to user, upsert analysis field
- [x] 2.3 Regenerate frontend API client: `npm run gen:api` in frontend

## 3. Frontend — Types

- [x] 3.1 Add `MoveClassification`, `MoveAnalysis`, `GameAnalysis` types to `frontend/src/components/ChessBoard/types/index.ts`

## 4. Frontend — useGameAnalysis Hook

- [x] 4.1 Create `frontend/src/components/ChessBoard/hooks/useGameAnalysis.ts`
- [x] 4.2 Spawn independent Stockfish worker (same pattern as `usePositionEvaluation`) — terminate on completion/error/unmount
- [x] 4.3 Accept `allFens: string[]`, `gameId: number`, `depth?: number` (default 18)
- [x] 4.4 Evaluate all N+1 positions sequentially; emit `progress: { current, total }` after each
- [x] 4.5 Compute `cp_loss` per move using `white_cp_loss[i] = max(0, scores[i] − scores[i+1])` and `black_cp_loss[i] = max(0, scores[i+1] − scores[i])`
- [x] 4.6 Classify each move using thresholds (best/excellent/good/inaccuracy/mistake/blunder)
- [x] 4.7 Compute `white_accuracy` and `black_accuracy` using lichess formula: `clamp(103.1668 × exp(−0.04354 × avg_cp_loss) − 3.1669, 0, 100)`
- [x] 4.8 POST analysis to `PUT /api/v1/games/{gameId}/analysis` on completion
- [x] 4.9 Return `{ analyze, status, progress, analysis }` where status is `'idle' | 'running' | 'done' | 'error'`

## 5. Frontend — MoveList

- [x] 5.1 Add optional `moveClassifications?: MoveClassification[]` prop to `MoveList`
- [x] 5.2 Color move tokens by classification: green (`best`/`excellent`), yellow (`good`/`inaccuracy`), red (`mistake`/`blunder`)
- [x] 5.3 Fall back to default styling if `moveClassifications` is absent or length mismatches `moves`

## 6. Frontend — GamesList

- [x] 6.1 Add `analysis` field to `Game` type in `frontend/src/features/games/types.ts` (nullable `GameAnalysis`)
- [x] 6.2 Display accuracy badges in `GameRow` when `game.analysis` is present: `"87% / 82%"` format

## 7. Frontend — GamesTab Wiring

- [x] 7.1 Collect `allFens` from `useChessGame` history (initial FEN + all history FENs) in `useGameHistory` or `useGamesTab`
- [x] 7.2 Instantiate `useGameAnalysis` in `useGamesTab`, pass `allFens` and `selectedGame.id`
- [x] 7.3 Expose `analyze`, `analyzeStatus`, `analyzeProgress`, `moveClassifications` from `useGamesTab`
- [x] 7.4 Add "Analyze" / "Re-analyze" button to `GamesTab` board title area (disabled while running)
- [x] 7.5 Show progress bar `"14 / 61"` below the button while `analyzeStatus === 'running'`
- [x] 7.6 Pass `moveClassifications` to `MoveList` in `GamesTab`
