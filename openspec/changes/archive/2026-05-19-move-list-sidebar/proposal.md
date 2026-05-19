## Why

The main page currently shows only the chess board with no game context. Players need to see the move history as they play so they can review the game — a move list is the standard companion panel in every chess interface.

## What Changes

- Add a `MoveList` reusable component that displays moves in algebraic notation, grouped by move pairs (white/black), scrolls automatically to the latest move
- Update the main page layout from a single centered board to a two-column layout: board on the left, move list on the right
- Wire `ChessBoard`'s `onMove` callback into the main page so moves feed the move list
- Install Tailwind CSS v4 (not yet installed, required for layout and component styling)

## Capabilities

### New Capabilities

- `move-list`: Reusable `MoveList` component — renders move history in standard chess notation pairs, highlights the current (last) move, scrolls to bottom on new move
- `main-page-layout`: Two-column main page layout — board + move list side by side, responsive (stacks vertically on small screens)

### Modified Capabilities

- `main-page`: Layout changes from centered single column to two-column board+sidebar. `ChessBoard` now shares game state with move list via lifted state in `App`.

## Impact

- `frontend/src/App.tsx`: lift game move state, pass `onMove` to `ChessBoard`, render `MoveList` alongside board
- `frontend/src/App.css`: replace single-center layout with two-column layout
- `frontend/src/components/MoveList/`: new component directory
- `frontend/package.json`: add Tailwind CSS v4 + `@tailwindcss/vite`
- `frontend/vite.config.ts`: add Tailwind Vite plugin
