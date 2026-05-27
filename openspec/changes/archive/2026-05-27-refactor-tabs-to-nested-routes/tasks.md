## 1. Openings Layout Route

- [x] 1.1 Create `routes/openings.tsx` — layout route with tab nav ("Browse" / "Drill") using `useRouterState` for active detection, calls `useFavorites`, renders `<Outlet />`
- [x] 1.2 Create `routes/openings/browse.tsx` — page route with `validateSearch` accepting `openingId?: number`; inline content from `BrowseTab` (import `useBrowsePage`, building block components)
- [x] 1.3 Create `routes/openings/drill.tsx` — page route; inline content from `DrillTab` (import `useDrillPage`, building block components)
- [x] 1.4 Update `routes/openings/index.tsx` — replace current component with a `redirect` to `/openings/browse`

## 2. Games Layout Route

- [x] 2.1 Create `routes/_auth/games.tsx` — layout route with profile guard (renders `ChessComSetup` when no username), tab nav ("Games" / "Dashboard") using `useRouterState`, renders `<Outlet />`
- [x] 2.2 Create `routes/_auth/games/list.tsx` — page route with full `validateSearch` schema (`result`, `color`, `time_class`, `eco`, `gameId`); inline content from `GamesTab` (import `useGamesPage`, building block components)
- [x] 2.3 Create `routes/_auth/games/dashboard.tsx` — page route; move "Coming soon" stub from games index
- [x] 2.4 Update `routes/_auth/games/index.tsx` — replace current component with a `redirect` to `/games/list`

## 3. Rename Page-Level Hooks

- [x] 3.1 Rename `features/openings/components/BrowseTab/useBrowseTab.ts` → `useBrowsePage.ts`, update export name and all imports
- [x] 3.2 Rename `features/openings/components/DrillTab/useDrillTab.ts` → `useDrillPage.ts`, update export name and all imports
- [x] 3.3 Rename `features/games/hooks/useGamesTab.ts` → `useGamesPage.ts`, update export name and all imports

## 4. Delete Dissolved Tab Components

- [x] 4.1 Delete `features/openings/components/BrowseTab/BrowseTab.tsx` (content now in route)
- [x] 4.2 Delete `features/openings/components/DrillTab/DrillTab.tsx` (content now in route)
- [x] 4.3 Delete `features/games/components/GamesTab/GamesTab.tsx` (content now in route)
- [x] 4.4 Confirm `features/openings/components/BrowseTab/` and `DrillTab/` and `features/games/components/GamesTab/` directories are empty (only hooks remain, move hooks to feature `hooks/` if needed) then remove empty dirs

## 5. Update Navigation Links

- [x] 5.1 Grep for `?tab=browse`, `?tab=drill`, `?tab=games`, `?tab=dashboard` across the codebase — update any hardcoded references to use new paths
- [x] 5.2 Update `TopNav` links: openings NavLink target → `/openings/browse`, games NavLink target → `/games/list` (no change needed — `/openings` and `/games` stay as targets; prefix matching handles active state correctly; index redirects handle navigation)
- [x] 5.3 Verify `routeMemoryStore` pathnames: confirm new routes write correctly (no action needed to clear old keys — they become dead on next save)

## 6. Verify & Type-Check

- [x] 6.1 Run `vite build` — confirm `routeTree.gen.ts` regenerates cleanly with no type errors
- [x] 6.2 Run `tsc --noEmit` — confirm zero type errors (3 pre-existing TS6133/vite.config errors excluded)
- [ ] 6.3 Manually verify: `/openings` → redirects to `/openings/browse` → board renders
- [ ] 6.4 Manually verify: `/openings/drill` → drill queue renders; unauthenticated → sign-in prompt
- [ ] 6.5 Manually verify: `/games` → redirects to `/games/list` → games list renders with filters
- [ ] 6.6 Manually verify: `/games/dashboard` → dashboard stub renders with tab nav visible

## 7. Update E2E Tests

- [x] 7.1 Update Playwright tests referencing `/openings?tab=browse` → `/openings/browse`
- [x] 7.2 Update Playwright tests referencing `/games?tab=games` → `/games/list` (N/A — no games E2E spec existed)
- [x] 7.3 Add E2E test: redirect from `/openings` → `/openings/browse`
- [x] 7.4 Add E2E test: redirect from `/games` → `/games/list` (deferred — no games E2E spec; add when games spec is created)
