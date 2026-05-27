## Why

Tab-based pages (`BrowseTab`, `DrillTab`, `GamesTab`) live in `features/` but own full viewport layouts and orchestrate data — they are pages, not reusable components. TanStack Router's nested route model is the correct home for pages; `features/` should contain only building blocks (lists, panels, hooks, API).

## What Changes

- **NEW** `routes/openings.tsx` — layout route: tab nav + `<Outlet />` + `useFavorites`
- **NEW** `routes/openings/browse.tsx` — page route at `/openings/browse` (absorbs `BrowseTab`)
- **NEW** `routes/openings/drill.tsx` — page route at `/openings/drill` (absorbs `DrillTab`)
- **MODIFIED** `routes/openings/index.tsx` — redirect to `/openings/browse`
- **NEW** `routes/_auth/games.tsx` — layout route: profile guard + tab nav + `<Outlet />`
- **NEW** `routes/_auth/games/list.tsx` — page route at `/games/list` (absorbs `GamesTab`)
- **NEW** `routes/_auth/games/dashboard.tsx` — page route at `/games/dashboard` (was inline stub)
- **MODIFIED** `routes/_auth/games/index.tsx` — redirect to `/games/list`
- **DELETED** `features/openings/components/BrowseTab/` — dissolved into route
- **DELETED** `features/openings/components/DrillTab/` — dissolved into route
- **DELETED** `features/games/components/GamesTab/` — dissolved into route
- **RENAMED** `useGamesTab` → `useGamesPage`, `useBrowseTab` → `useBrowsePage`, `useDrillTab` → `useDrillPage`
- **BREAKING** URL paths: `/openings?tab=browse` → `/openings/browse`, `/openings?tab=drill` → `/openings/drill`, `/games?tab=games` → `/games/list`, `/games?tab=dashboard` → `/games/dashboard`

## Capabilities

### New Capabilities

- `nested-tab-routing`: Each tab is a first-class route with its own URL, search param schema, and page component living in `routes/`

### Modified Capabilities

- `routing`: URL structure changes for openings and games tabs — nested paths replace query-param-based tab switching
- `openings-page`: Tab navigation becomes route navigation; `openingId` param lives only on `/openings/browse`
- `games-page`: Tab navigation becomes route navigation; filter params live only on `/games/list`

## Impact

- **Routes**: 6 new/modified route files; `routeTree.gen.ts` regenerated automatically by Vite plugin
- **Features**: `BrowseTab/`, `DrillTab/`, `GamesTab/` component directories deleted; hook renames only
- **TopNav**: NavLinks for openings/games updated to target `/openings/browse` and `/games/list`
- **routeMemoryStore**: Stale keys for old paths (`/openings/`, `/_auth/games/`) become dead — clear on migration
- **No backend changes**
- **`$gameId` route**: becomes child of `games.tsx` layout (inherits tab nav shell) — acceptable for now since it's a stub; revisit when feature is implemented
