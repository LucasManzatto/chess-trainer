## Why

A review of `ChessBoard` and `MoveList` against the project's React Philosophies guidelines (CLAUDE.md) found three violations: object references as `useCallback` dependencies causing unnecessary recreation, a component receiving a full object array when it only needs one primitive field, and a `for` loop where a higher-order function is preferred.

## What Changes

- **`ChessBoard`**: Apply the "latest ref pattern" to `handlePieceDrop` — store `game`, `onMove`, and `onGameOver` in refs so the callback has `[]` dependencies and is never recreated
- **`MoveList`**: Accept `moves: string[]` (SAN strings only) instead of `moves: MoveResult[]` — component only uses `.san`, should not receive the full object
- **`MoveList`**: Replace `for` loop with `Array.from` when building move pairs
- **`App.tsx`**: Update `MoveList` call site to pass `moves.map(m => m.san)` (**BREAKING** to `MoveList`'s prop type)

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `chess-board`: `handlePieceDrop` stability behaviour changes — callback no longer recreates on every move (internal implementation, no external API change)
- `move-list`: `moves` prop type changes from `MoveResult[]` to `string[]` — **BREAKING** to callers

## Impact

- `frontend/src/components/ChessBoard/ChessBoard.tsx`: latest ref pattern for `handlePieceDrop`
- `frontend/src/components/MoveList/MoveList.tsx`: prop type `string[]`, `Array.from` pairs
- `frontend/src/App.tsx`: pass `moves.map(m => m.san)` to `MoveList`
- No new dependencies
