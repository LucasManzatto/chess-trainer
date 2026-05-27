## Why

Navigating away from a page and returning via the TopNav resets all page state — selected opening, active filters, chosen game — because nav links navigate to bare paths with no search params. Every page should restore the last state the user was in.

## What Changes

- Add a `routeMemoryStore` (Zustand + localStorage persist) that maps route pathnames to their last known search params
- Subscribe to TanStack Router's `onResolved` event to auto-save each route's search params on every navigation — zero per-route wiring required
- Update TopNav `Link` components to restore last search params from the store when navigating to a route
- Add `validateSearch` to the games route (filters: result, color, time_class, eco; plus selectedGameId)
- Migrate `useGamesTab` filters from `useState` to URL search params (read via `useSearch`, write via `navigate`)

## Capabilities

### New Capabilities

- `route-state-persistence`: Per-route search param memory backed by Zustand + localStorage. Auto-saved on every navigation via router subscription. Restored by TopNav links on re-entry.

### Modified Capabilities

- `routing`: Root router gains a `router.subscribe('onResolved')` subscriber that feeds the route memory store.
- `top-nav`: Nav links switch from object `search` to store-aware restoration of last search params per route.
- `games-page`: Games route gains `validateSearch` schema; filters and selectedGameId move from React state to URL.

## Impact

- **frontend/src/app/router.ts** — add store subscriber after router creation
- **frontend/src/components/TopNav/TopNav.tsx** — links use store to restore search params
- **frontend/src/app/routes/_auth/games/index.tsx** — add `validateSearch` schema
- **frontend/src/features/games/hooks/useGamesTab.ts** — read/write filters via URL
- New file: **frontend/src/stores/routeMemoryStore.ts**
- No backend changes. No new npm dependencies (Zustand already installed).
