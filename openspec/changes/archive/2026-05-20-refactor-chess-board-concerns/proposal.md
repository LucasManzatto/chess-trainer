## Why

`ChessBoard.tsx` mixes six concerns in one component — chess game state, latest-ref boilerplate, responsive sizing, interaction handlers with deeply nested logic, hint-style derivation, and JSX render. Move execution and game-over detection are duplicated verbatim between `handlePieceDrop` and `handleSquareClick`.

## What Changes

- Extract `executeMove` helper to eliminate the duplicated move-execution + game-over block shared between both handlers
- Extract `useChessGame` hook owning all chess state, refs, handlers, and hint-style derivation
- Extract `useBoardSizing` hook owning `containerRef`, `ResizeObserver`, and `containerWidth`
- `ChessBoard` becomes a pure wiring layer: call two hooks, pass results to `<Chessboard />`

No behavior changes. Public API (`ChessBoardProps`, exported types) unchanged.

## Capabilities

### New Capabilities

<!-- none — this is a pure internal refactor with no new user-visible behavior -->

### Modified Capabilities

<!-- none — no spec-level behavior changes -->

## Impact

- `frontend/src/components/ChessBoard/ChessBoard.tsx` — shrinks to ~30 lines
- New files: `useChessGame.ts`, `useBoardSizing.ts` co-located in `src/components/ChessBoard/`
- No API changes, no new dependencies, no behavior changes visible to consumers
