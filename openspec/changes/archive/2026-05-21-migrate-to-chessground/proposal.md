## Why

`react-chessboard` delegates drag-and-drop to dnd-kit, which fails to fire `onDragEnd` when the window loses focus mid-drag — leaving a ghost piece stuck at the source square. The current workaround (remounting the board on `blur`/`visibilitychange`) is a fragile hack. `@lichess-org/chessground` handles drag natively (same library powering lichess.org), eliminating this class of bug entirely and providing a more capable board API for features planned later (arrows, premoves, custom highlights).

## What Changes

- Remove `react-chessboard` and its dnd-kit dependency
- Add `@lichess-org/chessground` (imperative API, native drag/drop)
- New `ChessGround` component: thin React wrapper (`useRef` + `useEffect` mounting pattern)
- Rewrite `useChessGame` hook: replace `react-chessboard` callback types with chessground's `movable.after` config pattern and `movable.dests` pre-computed legal moves map
- Remove `boardKey` remount hack from `ChessBoard`
- Add chessground CSS assets (base + theme + piece set)

## Capabilities

### New Capabilities

- `chessground-board`: React wrapper around `@lichess-org/chessground` with chess.js legal move integration, move callbacks, square highlighting, and board orientation support

### Modified Capabilities

*(none — this is an internal implementation swap; the `ChessBoard` component's public prop API stays the same)*

## Impact

**Dependencies**
- Remove: `react-chessboard`
- Add: `@lichess-org/chessground` (GPL-3.0 — source must remain open)

**Files changed**
- `frontend/src/components/ChessBoard/ChessBoard.tsx` — rewrite
- `frontend/src/components/ChessBoard/useChessGame.ts` — full rewrite (chessground config types replace react-chessboard callback types)
- `frontend/src/components/ChessBoard/useBoardSizing.ts` — survives unchanged
- `frontend/src/index.css` or entry point — add chessground CSS imports

**License**: `@lichess-org/chessground` is GPL-3.0. Chess-trainer must remain open source.

**No backend changes.**
