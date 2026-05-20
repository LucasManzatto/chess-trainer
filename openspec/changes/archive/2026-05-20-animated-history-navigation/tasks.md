## 1. ChessBoard — animation props

- [x] 1.1 Add `animationDurationInMs?: number` (default `300`) to `ChessBoardProps`
- [x] 1.2 Pass `showAnimations: true` and `animationDurationInMs` to `<Chessboard>` options

## 2. App.tsx — keyboard navigation

- [x] 2.1 Add `useEffect` with `keydown` listener on `window` for ArrowLeft, ArrowRight, Escape
- [x] 2.2 ArrowLeft: if in live mode and moves exist, set `viewIndex` to `moves.length - 2` (or `0` if only one move); if already in history, decrement but clamp at `0`
- [x] 2.3 ArrowRight: if in history mode, increment `viewIndex`; when reaching `moves.length - 1`, set to `null` (live); if already live, no-op
- [x] 2.4 Escape: set `viewIndex` to `null`
- [x] 2.5 Clean up event listener in `useEffect` return

## 3. Verification

- [ ] 3.1 Play several moves, then use ← → arrow keys and verify pieces animate one step at a time
- [ ] 3.2 Verify Escape returns to live interactive mode
- [ ] 3.3 Verify clicking a move in the list still works (existing behavior unchanged)
