## Why

Chess domain logic (move validation, history building, PGN parsing, threat detection) is entangled with React hooks and Zustand plumbing, making it impossible to test without a full React context setup and hard to reason about as the codebase grows. Extracting it into a pure, framework-agnostic `chess/` module creates a clear boundary between domain rules and UI wiring.

## What Changes

- **New `frontend/src/chess/` module** — pure TypeScript, zero React/Zustand imports:
  - `chess/game.ts` — `buildHistoryFromMoves`, `applyMove`, `navigateTo`, `undoLastMove`
  - `chess/pgn.ts` — `parsePgn` → `{ moves, metadata }`
  - `chess/analysis.ts` — `computeThreats`, `computeCandidateShapes` (moved from `utils/`)
  - `chess/types.ts` — `HistoryEntry`, `GameMetadata`, `ThreatSquares` (moved from `components/ChessBoard/types/`)
- **`chessStore.ts` becomes a thin Zustand shell** — all chess operations delegate to `chess/game.ts`; `chessEngine: Chess` removed from store state (store holds only `history[]` + `currentMoveIndex`)
- **`useChessGame.ts` becomes a thin React shell** — retains only UI glue: keyboard navigation, chessground config construction, callbacks; chess logic calls into `chess/`
- **`utils/index.ts`** — `computeThreats` and `computeCandidateShapes` removed (moved to `chess/analysis.ts`); `squareToPixel` stays (UI geometry)
- **Vitest unit tests** for all `chess/` functions — no DOM, no React test utils required
- Zero behavior change — pure refactor

## Capabilities

### New Capabilities

- `chess-domain`: Pure chess domain layer — framework-agnostic functions for game state, move application, history building, PGN parsing, and position analysis

### Modified Capabilities

- `chess-board`: Internal implementation changes — `chessEngine` removed from Zustand state; store delegates to `chess/game.ts`. No user-facing behavior change.
- `game-history`: `buildHistoryFromMoves` and history navigation now live in `chess/game.ts`; hook becomes a thin wrapper. No user-facing behavior change.
- `pgn-import`: `parsePgn` extracted to `chess/pgn.ts`; hook calls it directly. No user-facing behavior change.

## Impact

- `frontend/src/chess/` — new module (4 files)
- `frontend/src/components/ChessBoard/stores/chessStore.ts` — significant rewrite (delegates to `chess/game.ts`, drops `chessEngine` from state)
- `frontend/src/components/ChessBoard/hooks/useChessGame.ts` — simplified (chess logic removed)
- `frontend/src/components/ChessBoard/utils/index.ts` — 2 functions removed
- `frontend/src/components/ChessBoard/types/index.ts` — shared types moved to `chess/types.ts`, re-exported for backward compat
- All callers of `chessStore` actions — no API change (same function signatures)
- No backend changes
- No new dependencies
