## Why

The move list shows the game's history but offers no way to review it. Clicking a move to jump to that position — and locking the board while reviewing — is the foundational "game review" interaction that every chess interface needs.

## What Changes

- Each move token in `MoveList` becomes a clickable button; clicking jumps the board to that position
- `ChessBoard` gains an `interactive` prop: when `false`, all piece drops are rejected (read-only board)
- `MoveList` gains `selectedIndex` and `onMoveClick` props to control which move is highlighted and handle click events
- `App.tsx` lifts navigation state: tracks `viewIndex` (which historical position is being viewed, `null` = live) and passes the correct FEN and interactivity flag to `ChessBoard`
- Board returns to interactive (live mode) automatically when navigating back to the latest move

## Capabilities

### New Capabilities

- `move-history-navigation`: Game state navigation — user can click any move in the list to view that board position; board is read-only for all positions except the live (latest) one

### Modified Capabilities

- `chess-board`: Gains `interactive` prop — when `false`, board is read-only (no moves accepted)
- `move-list`: Move tokens become clickable buttons; gains `selectedIndex` and `onMoveClick` props

## Impact

- `frontend/src/App.tsx`: add `viewIndex` state, pass `position` + `interactive` to `ChessBoard`, pass `selectedIndex` + `onMoveClick` to `MoveList`
- `frontend/src/components/ChessBoard/ChessBoard.tsx`: add `interactive` prop, guard `handlePieceDrop`
- `frontend/src/components/MoveList/MoveList.tsx`: render move tokens as `<button>`, add `selectedIndex` + `onMoveClick` props, update highlight logic
- No new dependencies
