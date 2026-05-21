## 1. Dependencies & Worker Setup

- [x] 1.1 Add `stockfish` npm package (single-threaded WASM build) to `frontend/package.json`
- [x] 1.2 Create `frontend/src/workers/stockfish.worker.ts` — loads Stockfish WASM, forwards UCI messages via `postMessage`
- [x] 1.3 Verify Vite can bundle the worker with `new Worker(new URL(..., import.meta.url), { type: 'module' })` — confirm dev build works

## 2. Evaluation Types

- [x] 2.1 Create `frontend/src/features/evaluation/types.ts` — export `EvaluationScore` (`{ type: 'cp' | 'mate'; value: number }`), `EvaluationResult` (`{ score?: EvaluationScore; isLoading: boolean; error: boolean }`)

## 3. usePositionEvaluation Hook

- [x] 3.1 Create `frontend/src/features/evaluation/usePositionEvaluation.ts` — accepts `fen: string`, returns `EvaluationResult`
- [x] 3.2 Implement Worker creation on mount (`useRef`) and `worker.terminate()` on unmount
- [x] 3.3 Send UCI init sequence (`uci` → wait for `uciok` → `isready` → wait for `readyok`) before first position
- [x] 3.4 Implement position evaluation: send `position fen <fen>` + `go depth 18`; parse `info depth 18 ... score cp/mate` lines
- [x] 3.5 Implement cancellation: when FEN changes mid-search, send `stop` and discard partial results before starting new search
- [x] 3.6 Handle error state: catch Worker load failures and return `{ error: true, isLoading: false }`

## 4. EvaluationBar Component

- [x] 4.1 Create `frontend/src/features/evaluation/EvaluationBar.tsx` — accepts `score?: EvaluationScore` and `isLoading: boolean`
- [x] 4.2 Implement bar split calculation: clamp cp to ±1000, map to 0–100% white region; mate scores render as 0% or 100%
- [x] 4.3 Render white/black regions with CSS `transition: height 300ms` for smooth animation
- [x] 4.4 Render score label: `+2.3` / `-0.8` / `0.0` for cp; `M3` / `-M2` for mate
- [x] 4.5 Implement loading state: retain previous bar position, add pulse animation overlay while `isLoading`
- [x] 4.6 Handle no-score initial state: render 50/50 bar with loading pulse

## 5. Layout Integration

- [x] 5.1 Identify the game review page component that renders `ChessBoard`
- [x] 5.2 Add `usePositionEvaluation` to the review page, passing the current FEN from game state
- [x] 5.3 Place `EvaluationBar` to the left of `ChessBoard` in a flex row; bar height matches board height (`h-full`)
- [x] 5.4 Confirm bar sizing: narrow fixed width (e.g. `w-5`), full height of board

## 6. Verification

- [x] 6.1 Start dev server and navigate to game review; confirm evaluation bar appears alongside the board
- [x] 6.2 Navigate through several moves and confirm bar updates with correct score direction (white/black advantage)
- [x] 6.3 Advance to a known forced-mate position and confirm bar shows full white/black and `M<n>` label
- [x] 6.4 Rapidly navigate moves and confirm no stale scores are displayed
- [x] 6.5 Check browser console for Worker errors or unhandled promise rejections
