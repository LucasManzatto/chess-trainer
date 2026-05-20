## 1. Create useGameHistory hook

- [x] 1.1 Create `frontend/src/hooks/useGameHistory.ts` with `moves` and `viewIndex` state
- [x] 1.2 Move latest-ref pattern (`movesRef`, `viewIndexRef`, sync effect) into the hook
- [x] 1.3 Move keyboard `keydown` effect (←→Esc logic) into the hook
- [x] 1.4 Move `handleMove` and `handleMoveClick` handlers into the hook
- [x] 1.5 Compute and return derived values: `position`, `interactive`, `selectedIndex`

## 2. Simplify App.tsx

- [x] 2.1 Replace all state/refs/effects/handlers in `App.tsx` with a single `useGameHistory()` call
- [x] 2.2 Verify `App.tsx` contains only layout JSX and prop wiring — no `useState`, `useEffect`, or `useRef`

## 3. Verify

- [x] 3.1 TypeScript compiles with no errors (`npm run build` or `tsc --noEmit`)
- [x] 3.2 Manual smoke test: play moves, navigate history with ←→Esc and by clicking moves
