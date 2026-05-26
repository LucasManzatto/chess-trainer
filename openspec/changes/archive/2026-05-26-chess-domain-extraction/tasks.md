## 1. Create chess/ module skeleton

- [x] 1.1 Create `frontend/src/chess/` directory with empty `types.ts`, `game.ts`, `pgn.ts`, `analysis.ts`, `index.ts`
- [x] 1.2 Move shared types (`HistoryEntry`, `GameMetadata`, `ThreatSquares`, `MoveResult`, `GameOverResult`, `EvaluationScore`, `EvaluationResult`, `MoveClassification`, `MoveAnalysis`, `GameAnalysis`) into `chess/types.ts`
- [x] 1.3 Update `components/ChessBoard/types/index.ts` to re-export everything from `chess/types.ts` (keep `UseChessGameProps` local)
- [x] 1.4 Verify TypeScript compiles with no errors after types move

## 2. Implement chess/analysis.ts

- [x] 2.1 Move `computeThreats` from `components/ChessBoard/utils/index.ts` into `chess/analysis.ts`
- [x] 2.2 Move `computeCandidateShapes` from `components/ChessBoard/utils/index.ts` into `chess/analysis.ts`
- [x] 2.3 Update `components/ChessBoard/utils/index.ts` to remove moved functions (keep `squareToPixel`)
- [x] 2.4 Update all import sites that reference `computeThreats` or `computeCandidateShapes` from `utils/` to import from `chess/analysis` (or barrel `chess/`)

## 3. Implement chess/pgn.ts

- [x] 3.1 Extract PGN parsing logic from `useChessGame.ts` `loadFromPgn` into `parsePgn(pgn: string)` in `chess/pgn.ts` — returns `{ ok: true; moves: string[]; metadata: GameMetadata } | { ok: false; error: string }`
- [x] 3.2 Update `useChessGame.ts` `loadFromPgn` to call `parsePgn` and delegate all chess.js work to it

## 4. Implement chess/game.ts

- [x] 4.1 Implement `buildHistoryFromMoves(moves: string[]): HistoryEntry[]` — replays SAN list from starting position, returns history array
- [x] 4.2 Implement `applyMoveToPosition(currentFen, history, currentIndex, orig, dest)` — validates and applies move, returns updated history + new entry, or null if illegal
- [x] 4.3 Implement `getFenAtIndex(history: HistoryEntry[], index: number | null): string` — returns FEN for given index (`null` = last, `-1` = starting position)
- [x] 4.4 Implement `undoLastMove(history: HistoryEntry[], currentIndex: number)` — removes last entry, returns updated history + new index
- [x] 4.5 Export everything from `chess/index.ts` barrel

## 5. Rewrite chessStore.ts

- [x] 5.1 Remove `chessEngine: Chess` from `ChessState` interface and initial state
- [x] 5.2 Rewrite `loadMoves` to call `buildHistoryFromMoves` from `chess/game.ts`
- [x] 5.3 Rewrite `applyMove` to call `applyMoveToPosition` from `chess/game.ts` (reconstruct engine from current FEN inline)
- [x] 5.4 Rewrite `navigateBack`, `navigateForward`, `navigateToIndex` to use `getFenAtIndex` — remove `new Chess(fen)` reconstruction from store (store only updates `currentMoveIndex`)
- [x] 5.5 Rewrite `undo` to call `undoLastMove` from `chess/game.ts`
- [x] 5.6 Remove `Chess` import from `chessStore.ts` (verify no remaining direct chess.js usage)

## 6. Simplify useChessGame.ts

- [x] 6.1 Remove `chessEngine` from `useChessStore` selector calls — reconstruct inline where needed: `const chess = new Chess(getFenAtIndex(history, currentMoveIndex))`
- [x] 6.2 Update `dests` computation to use locally-reconstructed engine (not from store)
- [x] 6.3 Update `config` memo to use locally-reconstructed engine for `fen`, `inCheck`, `turn`
- [x] 6.4 Update `loadFromPgn` to delegate to `parsePgn` from `chess/pgn.ts` — remove local chess.js usage
- [x] 6.5 Update `computeThreats` call to import from `chess/analysis` instead of `utils/`
- [x] 6.6 Confirm `useChessGame.ts` has no remaining direct chess.js constructor calls beyond the inline engine reconstruction

## 7. Write unit tests

- [x] 7.1 Create `frontend/src/chess/__tests__/game.test.ts` — test `buildHistoryFromMoves` (valid moves, empty input, FEN correctness), `applyMoveToPosition` (legal, illegal, mid-history branch), `undoLastMove` (normal, empty)
- [x] 7.2 Create `frontend/src/chess/__tests__/pgn.test.ts` — test `parsePgn` (valid PGN, no moves, empty string, malformed)
- [x] 7.3 Create `frontend/src/chess/__tests__/analysis.test.ts` — test `computeThreats` (no threats in start pos, hanging piece, pinned piece), `computeCandidateShapes` (empty map, valid candidate)
- [x] 7.4 Confirm all tests run with `vitest run` and pass with no DOM environment

## 8. Verification

- [x] 8.1 Run `tsc --noEmit` — zero type errors
- [x] 8.2 Run `vitest run` — all tests pass
- [ ] 8.3 Manual smoke test: Free Play page — PGN import, move navigation, Stockfish eval bar all work
- [ ] 8.4 Manual smoke test: Games page — game selection, analysis, move classification all work
- [ ] 8.5 Manual smoke test: Openings Browse tab — board interaction, trie-driven continuations, threat overlay all work
- [ ] 8.6 Manual smoke test: Openings Drill tab — move validation, grading flow all work
- [x] 8.7 Confirm no `chessEngine` references remain in `chessStore.ts` via grep
- [x] 8.8 Confirm no React/Zustand imports exist in any `chess/*.ts` file via grep
