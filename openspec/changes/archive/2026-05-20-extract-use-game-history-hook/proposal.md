## Why

`App.tsx` mixes layout with game history logic — state, refs, effects, handlers, and derived values all live in the container. Extracting this logic into a `useGameHistory()` hook makes `App.tsx` a pure layout shell and isolates the navigation concern for reuse and testing.

## What Changes

- New `useGameHistory()` hook encapsulates all game history state and navigation logic
- `App.tsx` becomes a pure layout container — no state, no effects, no refs
- `ChessBoard` and `MoveList` remain props-based and reusable (no changes to their APIs)

## Capabilities

### New Capabilities

- `game-history`: Custom hook managing move history state, view index, keyboard navigation, and derived board props

### Modified Capabilities

<!-- none — no spec-level behavior changes, purely an internal refactor -->

## Impact

- `frontend/src/App.tsx` — removes all logic, retains layout JSX
- `frontend/src/hooks/useGameHistory.ts` — new file
- No API changes, no new dependencies, no behavior changes visible to the user
