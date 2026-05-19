## 1. ChessBoard — Latest Ref Pattern

- [x] 1.1 Add `gameRef`, `onMoveRef`, `onGameOverRef` refs in `ChessBoard.tsx`; assign `.current` on each render
- [x] 2.2 Rewrite `handlePieceDrop` to read from refs instead of closed-over values; change deps to `[]`
- [x] 1.3 Remove `game`, `onMove`, `onGameOver` from `useCallback` dependency array

## 2. MoveList — Primitive Props

- [x] 2.1 Change `MoveListProps.moves` type from `MoveResult[]` to `string[]`
- [x] 2.2 Replace `for` loop pair-building with `Array.from`
- [x] 2.3 Update all `.san` accesses to use the string directly (index into array)
- [x] 2.4 Remove `import type { MoveResult }` from `MoveList.tsx` (no longer needed)

## 3. App.tsx — Call Site Update

- [x] 3.1 Pass `moves.map(m => m.san)` to `<MoveList>` instead of `moves`

## 4. Verification

- [x] 4.1 Run `tsc --noEmit` — zero errors
- [x] 4.2 Run `eslint src/` — zero errors
- [x] 4.3 Run dev server and verify moves appear in list correctly after the refactor
