## 1. Dependencies

- [x] 1.1 Install `@lichess-org/chessground` via npm
- [x] 1.2 Remove `react-chessboard` from `package.json` and `package-lock.json`

## 2. CSS Setup

- [x] 2.1 Add chessground CSS imports to `frontend/src/index.css`: `chessground.base.css`, `chessground.brown.css`, `chessground.cburnett.css`

## 3. ChessGround React Wrapper

- [x] 3.1 Create `frontend/src/components/ChessBoard/ChessGround.tsx` — mounts `Chessground(el, config)` once via `useEffect` on a `div` ref, calls `api.set(config)` on config changes, calls `api.destroy()` on unmount
- [x] 3.2 Wrapper div must fill 100% width/height so the board scales with the container

## 4. Rewrite useChessGame

- [x] 4.1 Replace all `react-chessboard` type imports with `@lichess-org/chessground` types (`Key`, `Config`, etc.)
- [x] 4.2 Implement `toDests(chess: Chess): Map<Key, Key[]>` helper — converts chess.js legal moves to chessground dests map
- [x] 4.3 Build and return `Config` object with: `fen`, `orientation`, `movable.color`, `movable.dests`, `movable.after` callback, `animation.enabled`, `animation.duration`, `highlight.lastMove`, `highlight.check`
- [x] 4.4 `movable.after(orig, dest)` callback: attempt move in chess.js, call `onMove` with `{ from, to, san, fen }`, call `onGameOver` if game over, update dests
- [x] 4.5 When `interactive = false`, set `movable.color = undefined` (disables all interaction)
- [x] 4.6 `onMove` SHALL be read at call time (store in ref, not dep array) per existing spec requirement

## 5. Rewrite ChessBoard Component

- [x] 5.1 Replace `<Chessboard>` (react-chessboard) with `<ChessGround config={config} />` from the new wrapper
- [x] 5.2 Remove `boardKey` state, `resetBoard` callback, and `blur`/`visibilitychange` event listeners — no longer needed
- [x] 5.3 Remove `handlePieceDrop`, `handleSquareClick`, `handleMouseOverSquare`, `handleMouseOutSquare` from `useChessGame` interface (replaced by single `config` object)
- [x] 5.4 Verify `MoveResult` and `GameOverResult` types are still exported from `ChessBoard.tsx` (callers depend on them)

## 6. Smoke Test

- [x] 6.1 Drag piece: completes correctly, no ghost piece after drop
- [x] 6.2 Click-click move: select piece, click destination, move executes
- [x] 6.3 Blur during drag: switch windows mid-drag, no ghost piece stuck on return
- [x] 6.4 Board flip: toggle orientation, board renders correctly
- [x] 6.5 Non-interactive mode: navigate PGN history, board updates position but rejects drag
- [x] 6.6 Illegal move rejected: drag to invalid square, piece returns to source
