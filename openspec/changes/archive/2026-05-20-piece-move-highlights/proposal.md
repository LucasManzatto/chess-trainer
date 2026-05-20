## Why

Clicking a piece shows no visual feedback about where it can move, making the board hard to use for learning. Move hints reduce cognitive load and are standard in chess UIs.

## What Changes

- Clicking a piece computes all legal moves via `chess.js` and displays visual hints on valid destination squares
- Destination squares without an enemy piece show a pale green dot at center
- Destination squares with a capturable enemy piece show a full-cell pale green highlight
- Hovering any hinted square fills the entire cell with the same pale green color
- Clicking a blank square or making a move clears all hints

## Capabilities

### New Capabilities

- `move-hints`: Visual overlay on the chess board showing legal move destinations when a piece is selected — dot for empty squares, filled highlight for captures, hover fills cell

### Modified Capabilities

- `chess-board`: Click-to-select interaction now triggers move hint display; existing click-to-move behavior is preserved but extended with a selection/hint state

## Impact

- `frontend/src/components/ChessBoard/ChessBoard.tsx` — add selected-square state and hint rendering
- `react-chessboard` custom square styles API used for overlays
- No backend changes, no new dependencies
