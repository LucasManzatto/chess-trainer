## Context

TanStack Router v1 uses file-based routing where a file like `routes/openings.tsx` paired with a directory `routes/openings/` creates a layout route. The layout component renders `<Outlet />` and its children fill that outlet. This is the correct primitive for tab-based navigation: the layout holds the tab nav, each child is a tab page.

Currently the app has thin route files that delegate to `BrowseTab`, `DrillTab`, and `GamesTab` components in `features/`. Those components own full viewport layouts — they are pages. Moving them into routes/ gives them the correct identity and cleans `features/` down to true building blocks.

## Goals / Non-Goals

**Goals:**
- Each tab is a first-class route with its own URL and search param schema
- `features/` contains only reusable building blocks (components, hooks, API, types, utils)
- Tab navigation is route navigation (no `tab` query param)
- No visual or behavioral regression for the user

**Non-Goals:**
- Adding route loaders or prefetching (future opportunity, not this change)
- Changing the `$gameId` game detail page behavior (stub; address when feature is built)
- Changing any feature component that is already a true building block

## Decisions

### Layout route pair pattern
TanStack Router supports two ways to create a parent-with-children layout:

**Option A — Layout route pair**: `routes/openings.tsx` (layout) + `routes/openings/browse.tsx` (child)

**Option B — Pathless layout inside directory**: `routes/openings/_layout.tsx` (layout) + `routes/openings/browse.tsx` (child)

**Decision: Option A.** It's the idiomatic TanStack Router v1 pattern and produces cleaner file trees. The file `openings.tsx` at the same level as the `openings/` directory is auto-recognized as its layout.

### URL paths for games tabs
`/games/games` (child named same as parent segment) is redundant. `/games/list` clearly names the content and avoids the repetition.

**Decision: `/games/list`** for the games list+board tab.

### openingId scope
`openingId` is only meaningful in the browse context — it identifies which opening is loaded on the board. Drill has its own queue state. Passing `openingId` across routes would couple unrelated pages.

**Decision: `openingId` param lives only on `/openings/browse`.** When navigating browse→drill, it is not forwarded.

### useFavorites placement
`useFavorites` is a prefetch/cache-warmup call shared by both browse and drill. It must run whenever either tab is active.

**Decision: call `useFavorites` in the `openings.tsx` layout component.** It runs once for the whole openings section regardless of which tab is active.

### Page-level hook renaming
`useGamesTab`, `useBrowseTab`, `useDrillTab` are page orchestrators, not general-purpose hooks. They stay in `features/` (hooks in feature folders are fine) but their names should signal their scope.

**Decision: rename to `useGamesPage`, `useBrowsePage`, `useDrillPage`.**

### routeMemoryStore cleanup
The store is keyed by pathname. Old keys (`/openings/`, `/_auth/games/`) become dead after migration but cause no runtime errors.

**Decision: clear stale keys during migration by updating `routerSubscriber` in `router.ts` to write to new paths.** The old keys will naturally expire on next save; no explicit purge needed since they're just dead entries in localStorage.

### Tab nav active-link detection
Currently the tab nav checks `tab === id` against the search param. After migration, it should use TanStack Router's `useRouterState` or check `router.state.location.pathname` to determine the active tab.

**Decision: use `useRouterState` with `select` to read `location.pathname`, compare against tab route path.**

## Risks / Trade-offs

- **`$gameId` inherits tab nav shell** → The `routes/_auth/games.tsx` layout wraps `$gameId.tsx`. The game detail page will render inside the tab nav. Acceptable now (it's a "Coming soon" stub); revisit when implementing game detail.

- **Any hardcoded `?tab=` links in TopNav or tests** → Will break silently (no 404, just wrong behavior). Mitigation: grep for `tab=browse`, `tab=drill`, `tab=games` across codebase before finalizing.

- **E2E tests referencing old URLs** → Playwright tests targeting `/openings?tab=browse` need updating. Mitigation: covered in tasks.

## Migration Plan

1. Create layout routes (`openings.tsx`, `_auth/games.tsx`) with tab nav + `<Outlet />`
2. Create child page routes (browse, drill, list, dashboard) — inline the Tab component content
3. Update index routes to redirect to default tab
4. Delete dissolved Tab component directories from `features/`
5. Rename page-level hooks
6. Update TopNav links + any hardcoded `?tab=` references
7. Run `vite build` to confirm `routeTree.gen.ts` regenerates cleanly
8. Update/add E2E tests for new URLs

**Rollback**: git revert — no backend changes, no DB migrations.

## Open Questions

- Should the `openings.tsx` layout redirect `/openings` to `/openings/browse` via a `beforeLoad` redirect, or via a separate `openings/index.tsx`? Either works; separate index file is more explicit and easier to find.
