## Why

Clicking moves in the history list snaps the board to a new position instantly. Pieces should slide simultaneously to their new squares so the user can follow what changed between positions.

## What Changes

- Board enables explicit animation for all position transitions (both live moves and history navigation)
- Keyboard arrow keys (← →) navigate history one step at a time, producing animations every step
- Clicking a move in the list jumps directly to that position with animation
- Pressing `Escape` or navigating to the last move returns to live mode

## Capabilities

### New Capabilities

- `history-keyboard-navigation`: Left/right arrow keys step backward and forward through move history one move at a time; `Escape` returns to live (latest) position

### Modified Capabilities

- `chess-board`: Gains explicit `showAnimations` and `animationDurationInMs` options wired through from options/props to control animation behavior
- `move-list`: Receives keyboard focus delegation so arrow-key navigation works when the move list is focused

## Impact

- `frontend/src/components/ChessBoard/ChessBoard.tsx` — pass `showAnimations: true` and `animationDurationInMs` to `<Chessboard>`
- `frontend/src/App.tsx` — add `keydown` handler for ← → Escape; clamp index to valid range
- No new dependencies
