## 1. Dependencies

- [x] 1.1 Install `chess.js` and `react-chessboard` via npm in `frontend/`
- [x] 1.2 Verify TypeScript types are available (both packages ship their own types)

## 2. ChessBoard Component

- [x] 2.1 Create `frontend/src/components/ChessBoard/` directory with `index.ts` barrel export
- [x] 2.2 Implement `ChessBoard.tsx` with internal `chess.js` game state (uncontrolled default)
- [x] 2.3 Add `position` prop (FEN string) for controlled mode — sync to internal state when provided
- [x] 2.4 Wire up `onMove` callback with `{ from, to, promotion?, fen }` on every accepted move
- [x] 2.5 Wire up `onGameOver` callback with `{ result, winner? }` after checkmate/stalemate/draw detection
- [x] 2.6 Add `orientation` prop (`'white'` | `'black'`, default `'white'`)
- [x] 2.7 Implement responsive sizing — observe container width via `ResizeObserver`, pass to `boardWidth`
- [x] 2.8 Support `boardWidth` prop override that bypasses `ResizeObserver`

## 3. Main Page

- [x] 3.1 Replace `App.tsx` content with a centered layout that renders `<ChessBoard />`
- [x] 3.2 Add CSS to center board in viewport (flexbox, full viewport height)
- [x] 3.3 Set neutral background color on the page (remove Vite starter styles from `index.css`)
- [x] 3.4 Delete unused Vite starter assets (`reactLogo`, `viteLogo`, `heroImg`, counter state)

## 4. Cleanup

- [x] 4.1 Remove Vite starter boilerplate from `App.css`
- [x] 4.2 Verify no TypeScript errors (`tsc --noEmit`)
- [x] 4.3 Run dev server and manually verify: board renders, pieces move legally, illegal moves rejected
