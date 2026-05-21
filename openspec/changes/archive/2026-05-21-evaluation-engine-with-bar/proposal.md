## Why

Chess analysis needs position evaluation so users can see who's winning and by how much. Without an evaluation bar, users have no quantitative feedback during game review — just their own intuition.

## What Changes

- Integrate Stockfish (via `stockfish.js` WASM) into the frontend for local evaluation
- Add an evaluation bar component (vertical bar showing advantage/disadvantage)
- Display evaluation score (centipawns or mate-in-N) alongside the board
- Evaluation updates as user navigates moves in game review

## Capabilities

### New Capabilities

- `position-evaluation`: Chess engine integration that evaluates a FEN position and emits centipawn score and best move. Runs Stockfish WASM in a Web Worker to avoid blocking the main thread.
- `evaluation-bar`: Visual component that renders a vertical bar (white/black split) reflecting the current evaluation score. Shows numeric score below. Handles mate scores.

### Modified Capabilities

- `chess-board`: Board layout gains a flanking evaluation bar. No requirement changes to board behavior — only layout composition changes.

## Impact

- New dependency: `stockfish` (WASM build) — large asset (~6 MB), loaded lazily
- New Web Worker file for Stockfish communication
- Frontend layout: evaluation bar sits alongside `ChessBoard` component
- No backend changes required — evaluation runs entirely client-side
