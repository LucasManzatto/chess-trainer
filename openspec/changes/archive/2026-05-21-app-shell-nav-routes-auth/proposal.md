## Why

All planned features (puzzles, openings, game library, dashboard) need routes and a nav to be useful, and user accounts underpin progress tracking across all of them. Scaffolding the full route tree and auth wiring now prevents retrofitting later and gives every future change a stable foundation to build on.

## What Changes

- Add `@neondatabase/neon-js` and wire `NeonAuthUIProvider` + `createAuthClient` in the root layout
- Rewrite `__root.tsx` with a persistent top nav (Free Play / Puzzles / Openings / Dashboard / Games) and a login modal triggered by `?modal=login` search param
- Add `_auth.tsx` pathless layout route that guards auth-required pages and redirects unauthenticated users to `/?modal=login`
- Add 9 new skeleton route files — correct TanStack Router definitions, placeholder UI, no feature logic
- Add `VITE_NEON_AUTH_URL` env var

## Capabilities

### New Capabilities

- `top-nav`: Persistent top navigation bar rendered on every page — links to all sections, auth-aware right side (Sign In button or user avatar + Account link)
- `login-modal`: Modal dialog containing Neon's `AuthView` component, shown/hidden via `?modal=login` URL search param; usable from any page without a full redirect
- `auth-guard`: Pathless `_auth` layout route that checks session via `authClient` in `beforeLoad`; redirects unauthenticated visitors to `/?modal=login`
- `puzzles-page`: `/puzzles` index page (public) and `/puzzles/:puzzleId` detail page — skeleton only
- `openings-page`: `/openings` page — skeleton only
- `dashboard-page`: `/dashboard` page (auth-required) — skeleton only
- `games-page`: `/games` index and `/games/:gameId` detail (auth-required) — skeleton only

### Modified Capabilities

- `routing`: Root layout gains `NeonAuthUIProvider`, nav, and login modal; `?modal=login` search param added to root route schema

## Impact

- `frontend/src/routes/__root.tsx`: rewritten
- `frontend/src/lib/auth.ts`: new — Neon auth client singleton
- `frontend/src/routes/_auth.tsx`: new pathless layout
- `frontend/src/routes/_auth/dashboard.tsx`: new skeleton
- `frontend/src/routes/_auth/games/index.tsx`: new skeleton
- `frontend/src/routes/_auth/games/$gameId.tsx`: new skeleton
- `frontend/src/routes/puzzles/index.tsx`: new skeleton
- `frontend/src/routes/puzzles/$puzzleId.tsx`: new skeleton
- `frontend/src/routes/openings/index.tsx`: new skeleton
- `frontend/src/routes/auth/$pathname.tsx`: Neon auth pages (email verify etc.)
- `frontend/src/routes/account/$pathname.tsx`: Neon account management
- `frontend/package.json`: add `@neondatabase/neon-js`
- `frontend/.env`: add `VITE_NEON_AUTH_URL`
