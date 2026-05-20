## 1. Extract useBoardSizing hook

- [x] 1.1 Create `frontend/src/components/ChessBoard/useBoardSizing.ts` with `containerRef`, `ResizeObserver` effect, and `containerWidth` state
- [x] 1.2 Return `{ containerRef, width }` where `width` resolves `boardWidth ?? containerWidth`

## 2. Extract executeMove helper

- [x] 2.1 Add module-level `executeMove(fen, from, to, promotion?)` function in `useChessGame.ts` that returns `{ game: Chess, move } | null`
- [x] 2.2 Verify promotion detection logic is in `executeMove` (not duplicated in handlers)

## 3. Extract useChessGame hook

- [x] 3.1 Create `frontend/src/components/ChessBoard/useChessGame.ts`
- [x] 3.2 Move `game`, `selectedSquare`, `hoveredSquare`, `prevPosition` state into hook
- [x] 3.3 Move latest-ref pattern (5 refs + `useLayoutEffect`) into hook
- [x] 3.4 Move `handlePieceDrop` into hook, replace inline move logic with `executeMove`
- [x] 3.5 Move `handleSquareClick` into hook, replace inline move logic with `executeMove`
- [x] 3.6 Move `handleMouseOverSquare` and `handleMouseOutSquare` into hook
- [x] 3.7 Derive `squareStyles` inside hook; return it as part of the hook's return value
- [x] 3.8 Return flat object: `{ game, squareStyles, handlePieceDrop, handleSquareClick, handleMouseOverSquare, handleMouseOutSquare }`

## 4. Simplify ChessBoard

- [x] 4.1 Replace all state/refs/effects/handlers in `ChessBoard.tsx` with calls to `useChessGame()` and `useBoardSizing()`
- [x] 4.2 Verify `ChessBoard.tsx` contains only hook calls, prop wiring, and JSX render — no `useState`, `useEffect`, `useRef`, or logic
- [x] 4.3 Ensure exported types (`MoveResult`, `GameOverResult`, `ChessBoardProps`) remain exported from `ChessBoard.tsx`

## 5. Verify

- [x] 5.1 TypeScript compiles with no errors (`npm run build`)
- [x] 5.2 Manual smoke test: drag-and-drop move, click-to-move, move hints visible, history navigation still works
