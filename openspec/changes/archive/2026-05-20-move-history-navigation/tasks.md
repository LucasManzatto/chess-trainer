## 1. ChessBoard — add `interactive` prop

- [x] 1.1 Add `interactive?: boolean` to `ChessBoardProps` (default `true`)
- [x] 1.2 Guard `handlePieceDrop`: return `false` immediately when `interactive` is `false`
- [x] 1.3 Update barrel export in `index.ts` if `ChessBoardProps` type is re-exported

## 2. MoveList — clickable tokens and `selectedIndex`

- [x] 2.1 Add `selectedIndex?: number | null` and `onMoveClick?: (index: number) => void` to `MoveListProps`
- [x] 2.2 Render each move token as a `<button>` that calls `onMoveClick(flatIndex)` on click
- [x] 2.3 Replace `lastMoveIndex` highlight logic with `selectedIndex` comparison

## 3. App.tsx — lift navigation state

- [x] 3.1 Add `viewIndex: number | null` state (initial `null`)
- [x] 3.2 Derive `position` for `ChessBoard`: `moves[viewIndex].fen` when reviewing, `moves.at(-1)?.fen` when live
- [x] 3.3 Derive `interactive` for `ChessBoard`: `viewIndex === null`
- [x] 3.4 Implement `handleMoveClick`: set `viewIndex` to `null` when clicking the last move, otherwise set to the index
- [x] 3.5 Pass `selectedIndex` and `onMoveClick` to `MoveList` (`selectedIndex = viewIndex ?? moves.length - 1`)
- [x] 3.6 Reset `viewIndex` to `null` when a new move is made (guard: only reachable if already live, so no change needed — verify)
