## 1. Create chess/evaluation.ts

- [ ] 1.1 Create `frontend/src/chess/evaluation.ts` — move `classifyMove`, `cpToWinPercent`, `computeAccuracy` from `useGameAnalysis.ts`
- [ ] 1.2 Export all three from `chess/index.ts` barrel
- [ ] 1.3 Verify TypeScript compiles with no errors

## 2. Create chess/stockfish.ts

- [ ] 2.1 Create `frontend/src/chess/stockfish.ts` with `parseScore` — moved from `usePositionEvaluation.ts`
- [ ] 2.2 Add `toWhitePerspective` — moved from `usePositionEvaluation.ts`
- [ ] 2.3 Add `createStockfishWorker(sfUrl: string, sfWasmUrl: string): Promise<Worker>` — consolidates duplicated UCI handshake from both hooks (`initWorker` in `useGameAnalysis.ts` + inline init in `usePositionEvaluation.ts` `useEffect`)
- [ ] 2.4 Add `evalFen(worker: Worker, fen: string, depth: number): Promise<{ score: number; bestMove: string }>` — moved from `useGameAnalysis.ts`; uses `parseScore` and `toWhitePerspective` internally instead of inline regex
- [ ] 2.5 Export all from `chess/index.ts` barrel

## 3. Simplify useGameAnalysis.ts

- [ ] 3.1 Remove `classifyMove`, `cpToWinPercent`, `computeAccuracy` — import from `chess/evaluation`
- [ ] 3.2 Remove `evalFen`, `initWorker` — import `evalFen`, `createStockfishWorker` from `chess/stockfish`
- [ ] 3.3 Replace `new Worker(${sfUrl}#${sfWasmUrl})` call with `createStockfishWorker(sfUrl, sfWasmUrl)`
- [ ] 3.4 Confirm no inline regex score parsing remains in hook

## 4. Simplify usePositionEvaluation.ts

- [ ] 4.1 Remove `parseScore`, `toWhitePerspective` — import from `chess/stockfish`
- [ ] 4.2 Replace inline Worker construction + UCI handshake in `useEffect` with `createStockfishWorker(sfUrl, sfWasmUrl)` — keep stop/go/pending state machine in hook
- [ ] 4.3 Confirm `sfUrl`/`sfWasmUrl` Vite `?url` imports remain in the hook file (they're build-time, not domain logic)

## 5. Write unit tests

- [ ] 5.1 Create `frontend/src/chess/__tests__/evaluation.test.ts`:
  - `classifyMove(0)` → `'best'`, `classifyMove(10)` → `'excellent'`, `classifyMove(55)` → `'mistake'`, `classifyMove(200)` → `'blunder'`
  - `cpToWinPercent(0)` → `50`, `cpToWinPercent(600)` ≈ `73`
  - `computeAccuracy([])` → `100`, `computeAccuracy` clamps to `[0, 100]`
- [ ] 5.2 Create `frontend/src/chess/__tests__/stockfish.test.ts`:
  - `parseScore('info depth 18 score cp -45 ...')` → `{ type: 'cp', value: -45 }`
  - `parseScore('info depth 18 score mate 3 ...')` → `{ type: 'mate', value: 3 }`
  - `parseScore('info depth 18 nodes 1000')` → `null`
  - `toWhitePerspective({ type: 'cp', value: 50 }, white-to-move FEN)` → unchanged
  - `toWhitePerspective({ type: 'cp', value: 50 }, black-to-move FEN)` → `{ type: 'cp', value: -50 }`

## 6. Verification

- [ ] 6.1 Run `vitest run` — all tests pass
- [ ] 6.2 Run `tsc --noEmit` — zero type errors
- [ ] 6.3 Confirm no React/Zustand imports in `chess/evaluation.ts` or `chess/stockfish.ts` via grep
- [ ] 6.4 Manual smoke test: Stockfish eval bar updates on move navigation
- [ ] 6.5 Manual smoke test: Game analysis runs to completion, move classifications display correctly
