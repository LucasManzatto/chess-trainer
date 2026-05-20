## Why

`MoveList` has three quality issues: white and black move buttons duplicate ~12 lines of identical markup (painful to extend), the auto-scroll only triggers on new moves so keyboard history navigation can leave the selected move off-screen, and `key={pairIndex}` will cause React animation glitches if moves are ever truncated (puzzle mode branching).

## What Changes

- Extract `MoveToken` component to eliminate duplicated white/black button markup
- Fix scroll behavior: scroll the selected move into view when `selectedIndex` changes (not just when new moves arrive)
- Replace `key={pairIndex}` with a stable key so truncating `moves` doesn't recycle wrong DOM nodes

No behavior changes visible under normal play. Scroll-to-selected is a UX fix for keyboard history navigation.

## Capabilities

### New Capabilities

<!-- none — no new user-visible capabilities -->

### Modified Capabilities

- `move-list`: `Auto-scroll to latest move` requirement expands — scroll must also bring the selected move into view when `selectedIndex` changes during history navigation

## Impact

- `frontend/src/components/MoveList/MoveList.tsx` — primary change
- New file: `MoveToken` co-located in `src/components/MoveList/` (or inline helper)
- No prop API changes, no behavior changes for consumers
