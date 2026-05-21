## Context

Chess Trainer has a functional board, move list, and PGN import. Users can replay games move-by-move but have no quantitative feedback on position quality. Adding Stockfish evaluation closes this gap. Evaluation must run entirely client-side — the backend has no chess engine and adding one would complicate the stack for a feature that browsers handle well.

## Goals / Non-Goals

**Goals:**
- Integrate Stockfish WASM engine running in a Web Worker
- Expose a `usePositionEvaluation` hook that accepts a FEN and returns centipawn/mate evaluation
- Render an `EvaluationBar` component flanking the board that visualizes the current evaluation
- Evaluation updates automatically as the user navigates moves

**Non-Goals:**
- Server-side evaluation (no backend changes)
- Best move arrows or engine lines display
- Multiple engine support or engine selection UI
- Opening book integration
- Evaluation of puzzle positions or free-play (only game review for now)

## Decisions

### 1. Client-side Stockfish WASM over a backend engine

Stockfish runs in the browser via WASM with near-native performance for shallow depths (depth 12–18). This avoids server cost, latency, and infra complexity. The tradeoff is a ~6 MB WASM asset on first load — acceptable with lazy loading.

**Alternatives considered:**
- Backend engine (python-chess + Stockfish binary): adds a FastAPI endpoint, process management, and eval must round-trip over HTTP. Overkill for the current scale.

### 2. Web Worker for engine communication

Stockfish WASM blocks the main thread if run inline. A dedicated Worker keeps the UI responsive while the engine searches. Messages are passed as strings (UCI protocol) via `postMessage`.

**Pattern:** `src/workers/stockfish.worker.ts` — Vite handles Worker bundling with `new Worker(new URL(..., import.meta.url), { type: 'module' })`.

### 3. `usePositionEvaluation` custom hook owns the Worker lifecycle

The hook creates one Worker instance (via `useRef`) on mount and terminates it on unmount. It sends UCI `position fen <fen>` + `go depth 18` on each FEN change and parses `info depth ... score cp/mate` lines from engine output.

Pending evaluations are superseded — when a new FEN arrives before the current search finishes, the hook sends `stop` then immediately issues the new position. No stale results leak to the UI.

### 4. Evaluation state stored locally in the hook (not Zustand)

Evaluation is purely derived from the current FEN. It doesn't need to persist across sessions or be shared between distant components. Local `useState` inside the hook is the right scope — simpler, co-located, no global store pollution.

### 5. EvaluationBar as a pure display component

`EvaluationBar` receives `score: { type: 'cp' | 'mate'; value: number }` and renders accordingly. It owns no engine logic. This makes it trivially testable and reusable.

**Layout:** The bar sits to the left of the board as a tall narrow column (e.g., `w-4` or `w-6`). White advantage fills from the bottom; black advantage fills from the top. The midpoint represents equality (0.0).

### 6. Score clamping and display

Centipawn scores are clamped to ±1000 cp for the visual bar (positions beyond ±10 pawns are decisive regardless of exact score). The numeric display shows the score in pawn units (cp / 100), e.g. `+2.3` or `-0.8`. Mate scores display as `M5` / `-M3`.

## Risks / Trade-offs

- **WASM asset size (~6 MB)** → Lazy-load the worker only when the game review page mounts. Use Vite's dynamic import or `React.lazy` boundary around the evaluation feature.
- **COOP/COEP headers required for `SharedArrayBuffer`** — some Stockfish WASM builds require cross-origin isolation. Use the single-threaded Stockfish build (`stockfish.js`) to avoid this requirement entirely, at the cost of slightly slower search.
- **Evaluation lag on slow machines** → Depth 18 can take 1–3 seconds. Show a loading spinner on the bar while engine is thinking. Never block navigation — user can flip through moves faster than the engine evaluates.
- **Engine re-init cost** — Worker cold start takes ~200ms. Evaluate positions eagerly when the review page loads rather than waiting for user interaction.

## Migration Plan

Additive change. No existing behavior changes. Deploy: merge to main, no feature flag needed. Rollback: revert commit — no database or API changes involved.

## Open Questions

- Should evaluation auto-start at depth 18 or allow the user to configure depth? Start with a fixed depth 18; add a setting later if requested.
- Should the bar appear on the puzzle page too, or only on game review? Scope to game review for this change.
