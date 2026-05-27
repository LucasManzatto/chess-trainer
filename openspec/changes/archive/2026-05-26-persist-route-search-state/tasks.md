## 1. Route Memory Store

- [x] 1.1 Create `frontend/src/stores/routeMemoryStore.ts` — Zustand store with `persist` middleware (localStorage key: `route-memory`), shape: `{ routes: Record<string, Record<string, unknown>>, save(pathname, search): void }`
- [x] 1.2 Wire `router.subscribe('onResolved', ...)` in `frontend/src/app/router.ts` to call `routeMemoryStore.getState().save(pathname, search)` on every resolved navigation

## 2. TopNav Link Restoration

- [x] 2.1 Update `TopNav` nav links to use a search function instead of object: merge stored params from `routeMemoryStore` for the target route with root-level `modal` param preservation
- [x] 2.2 Verify Openings nav link restores `tab` and `openingId` after navigating away and back

## 3. Games Route Search Params

- [x] 3.1 Add `validateSearch` schema to `frontend/src/app/routes/_auth/games/index.tsx` with fields: `result`, `color`, `time_class`, `eco`, `gameId` — all with `.catch(default)` fallbacks
- [x] 3.2 Refactor `useGamesTab` to read filters from `useSearch({ from: '/_auth/games/' })` instead of `useState`
- [x] 3.3 Replace individual `setResult`/`setColor`/`setTimeClass`/`setEco` setState calls with `navigate` calls that update the corresponding search param (use `replace: true`)
- [x] 3.4 Persist `gameId` to URL on `selectGame` — write `gameId: game.id` via `navigate`; on mount, if `gameId` is set and games have loaded, auto-select the matching game
- [x] 3.5 Guard stale `gameId`: after games list loads, if stored `gameId` is not found in the list, clear it via `navigate` with `replace: true`
