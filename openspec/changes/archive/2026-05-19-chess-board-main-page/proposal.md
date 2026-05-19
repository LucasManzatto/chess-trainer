## Why

The app currently shows a default Vite starter page. A playable chess board is the core feature of the chess trainer — it must exist as a reusable component so other screens (puzzles, analysis, games) can embed it without duplication.

## What Changes

- Replace default Vite starter content in `App.tsx` with a main page layout
- Add a `ChessBoard` reusable React component that renders a fully playable chess board
- Install chess libraries (`chess.js` for game logic, `react-chessboard` for the board UI)
- Center the chess board on the main page with a clean, minimal layout

## Capabilities

### New Capabilities

- `chess-board`: Reusable `ChessBoard` React component — renders an interactive chess board, manages piece movement, enforces legal moves via chess.js, exposes props for external position/state control
- `main-page`: Main app page — replaces Vite starter, renders `ChessBoard` centered on the page with basic layout scaffolding

### Modified Capabilities

<!-- none -->

## Impact

- `frontend/src/App.tsx`: replaced with main page layout
- `frontend/src/components/ChessBoard/`: new reusable component directory
- `frontend/package.json`: new dependencies (`chess.js`, `react-chessboard`)
- No backend changes
