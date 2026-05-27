## Context

TopNav links navigate to bare paths (`/openings/`, `/games/`) with `search={{ modal: undefined }}`, which destroys all route-level search params on re-entry. Routes like `/openings/` already encode UI state (active tab, selected opening) in URL search params via TanStack Router's `validateSearch`. The games route does not yet use search params — filters live in `useState`. The fix requires both a memory mechanism and migrating games state to URL.

## Goals / Non-Goals

**Goals:**
- Every page restores its last search params when re-entered via TopNav
- Zero per-route wiring — new routes get this for free
- State survives full page refresh (not just tab switches)
- Games filters and selectedGameId become URL-driven

**Non-Goals:**
- Persisting board position or move index (ephemeral, expensive to serialize)
- Cross-tab sync (each tab has independent state)
- Server-side rendering concerns

## Decisions

### Decision: Zustand store + localStorage over `retainSearchParams`

TanStack Router's `retainSearchParams` carries params forward into every subsequent route's URL (e.g. `/games?tab=browse&openingId=42`). This pollutes unrelated routes and makes URLs misleading.

The store approach keeps each route's memory isolated — params are only injected when navigating *to* a specific route, not carried through all intermediate routes.

### Decision: `router.subscribe('onResolved')` for auto-saving

Rather than each route component calling `store.save(pathname, search)` in a `useEffect`, we subscribe to the router's `onResolved` event once at app boot (in `router.ts`). Every successful navigation writes `location.pathname → location.search` to the store automatically. No per-route code needed.

```
router.subscribe('onResolved', () => {
  const { pathname, search } = router.state.location
  useRouteMemoryStore.getState().save(pathname, search)
})
```

### Decision: TopNav links use search function, not object

Current: `search={{ modal: undefined }}` — replaces entire search, loses memory.

New: `search={(prev) => ({ ...routeMemory[to] ?? {}, modal: prev.modal })}` — merges stored params with any global params (modal) that must be preserved from the root schema.

### Decision: Games filters move to URL search params

`useGamesTab` currently holds filters in `useState`. Moving them to `validateSearch` + `useSearch` + `navigate` makes them URL-driven, enabling refresh-resilient state and shareable filter URLs. The `selectedGameId` is also persisted so returning to the games page re-selects the last viewed game (if still in the filtered list).

**Games search schema:**
```ts
z.object({
  result:      z.enum(['win','loss','draw']).nullable().default(null).catch(null),
  color:       z.enum(['white','black']).nullable().default(null).catch(null),
  time_class:  z.enum(['bullet','blitz','rapid','classical']).nullable().default(null).catch(null),
  eco:         z.string().default('').catch(''),
  gameId:      z.number().optional().catch(undefined),
})
```

`.catch()` on every field ensures invalid/stale localStorage values degrade gracefully to defaults.

### Decision: Store lives in `src/stores/routeMemoryStore.ts`

Consistent with existing store location pattern (`src/features/openings/stores/`, `src/components/ChessBoard/stores/`). Route memory is app-wide, not feature-scoped, so `src/stores/` is the right level.

## Risks / Trade-offs

- **Stale gameId** → If the user returns to games with a stored `gameId` that no longer matches the current filter set, the game won't be found in the list. Mitigation: `useGamesTab` checks if the stored `gameId` exists in the fetched games list; if not, clears it via `navigate`.
- **localStorage quota** — Search params are small key/value strings. No realistic risk of exceeding quota.
- **Schema evolution** — Adding a new search param to a route means old stored objects won't have it. Mitigation: `validateSearch` + `.catch(default)` handles missing keys gracefully.
