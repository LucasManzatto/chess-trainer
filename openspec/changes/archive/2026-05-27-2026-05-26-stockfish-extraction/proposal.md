## Why

Stockfish-related logic is split across two hooks (`useGameAnalysis`, `usePositionEvaluation`) with duplicated Worker initialization code, and pure math functions (`classifyMove`, `cpToWinPercent`, `computeAccuracy`, `parseScore`, `toWhitePerspective`) are buried inside hook files where they can't be tested. Extracting them into `src/chess/` — following the same pattern established by `chess-domain-extraction` — makes the math testable with zero setup and the hooks into thin orchestrators.

## What Changes

- **New `frontend/src/chess/evaluation.ts`** — pure chess evaluation math, no Stockfish dependency:
  - `classifyMove(cpLoss: number): MoveClassification`
  - `cpToWinPercent(cp: number): number`
  - `computeAccuracy(winPercentLosses: number[]): number`

- **New `frontend/src/chess/stockfish.ts`** — Stockfish UCI protocol, injectable for tests:
  - `parseScore(line: string): EvaluationScore | null`
  - `toWhitePerspective(score: EvaluationScore, fen: string): EvaluationScore`
  - `createStockfishWorker(sfUrl: string, sfWasmUrl: string): Promise<Worker>` — consolidates the duplicated UCI handshake from both hooks
  - `evalFen(worker: Worker, fen: string, depth: number): Promise<{ score: number; bestMove: string }>` — extracted from `useGameAnalysis`

- **`useGameAnalysis.ts` becomes a thin orchestrator** — calls `createStockfishWorker`, `evalFen`, `evaluation.ts` math, and `gamesApi.saveAnalysis`; no inline parsing or math

- **`usePositionEvaluation.ts` becomes a thin orchestrator** — calls `createStockfishWorker`, `parseScore`, `toWhitePerspective`; retains its stop/go/pending state machine (genuinely hook logic)

- **Vitest unit tests** for all `evaluation.ts` and `stockfish.ts` pure functions — no DOM, no React

- Zero behavior change — pure refactor

## Capabilities

### New Capabilities

- `chess-evaluation`: Pure evaluation math — move classification thresholds, centipawn-to-win-percent conversion, accuracy scoring formula

### Modified Capabilities

- `game-analysis`: Internal implementation change — `useGameAnalysis` delegates to `chess/stockfish.ts` and `chess/evaluation.ts`. No user-facing behavior change.
- `position-evaluation`: Internal implementation change — `usePositionEvaluation` delegates to `chess/stockfish.ts`. No user-facing behavior change.

## Impact

- `frontend/src/chess/evaluation.ts` — new file (~30 lines)
- `frontend/src/chess/stockfish.ts` — new file (~60 lines)
- `frontend/src/chess/__tests__/evaluation.test.ts` — new test file
- `frontend/src/chess/__tests__/stockfish.test.ts` — new test file (pure functions only)
- `frontend/src/components/ChessBoard/hooks/useGameAnalysis.ts` — remove `classifyMove`, `cpToWinPercent`, `computeAccuracy`, `evalFen`, `initWorker`; import from `chess/`
- `frontend/src/components/ChessBoard/hooks/usePositionEvaluation.ts` — remove `parseScore`, `toWhitePerspective`, inline Worker init; import from `chess/`
- No backend changes
- No new dependencies
- No API or behavior changes
