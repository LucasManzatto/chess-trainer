## Context

`App.tsx` currently owns all game history logic: two state values (`moves`, `viewIndex`), a latest-ref pattern to keep keyboard handler up to date, a `keydown` effect for ←→Esc navigation, two event handlers, and three derived values. This is a pure internal refactor — no behavior changes, no new dependencies.

## Goals / Non-Goals

**Goals:**
- `App.tsx` contains only layout JSX and prop wiring
- All game history logic lives in `useGameHistory()`
- `ChessBoard` and `MoveList` APIs unchanged

**Non-Goals:**
- Introducing Zustand or any global state
- Changing keyboard navigation behavior
- Refactoring `ChessBoard` or `MoveList` internals
- Creating a full feature-sliced folder structure

## Decisions

### Hook location: `src/hooks/useGameHistory.ts`

Feature-sliced structure (`src/features/<feature>/`) is the long-term target, but there is no `features/` directory yet. Creating one for a single hook would be premature. A flat `src/hooks/` folder is the right stopping point today; the hook can migrate to `src/features/game/` when that slice is established.

Alternatives considered:
- `src/features/game/hooks/useGameHistory.ts` — right eventual home, wrong now (no other game feature code exists)
- Inline in `App.tsx` — status quo, the thing we're fixing

### Hook API: return a flat object

```ts
const {
  moves,
  viewIndex,
  handleMove,
  handleMoveClick,
  position,
  interactive,
  selectedIndex,
} = useGameHistory()
```

Derived values (`position`, `interactive`, `selectedIndex`) are computed inside the hook, not in App.tsx. App.tsx only wires props.

Alternatives considered:
- Separate `derived` sub-object — unnecessary nesting for three values
- Returning raw state and letting App compute derived — defeats the purpose

### Latest-ref pattern stays inside hook

The `movesRef`/`viewIndexRef` + sync effect is an implementation detail of the keyboard handler. It belongs inside `useGameHistory`, invisible to `App.tsx`.

## Risks / Trade-offs

- No behavioral risks — pure extraction, same logic in a new location
- Hook is not generic/reusable by design; it owns the specific keyboard shortcuts and navigation semantics of the game page
