## Context

The app currently has two routes (`/` and `__root.tsx` with no visible chrome). Every planned feature — puzzles, openings, game library, dashboard — needs a route, and several need auth. Adding routes one-by-one per feature change would force repeated `__root.tsx` edits and auth retrofitting. This change scaffolds the full shell in one go.

Neon auth is already provisioned. The reference implementation in `speech-trainer` uses `@neondatabase/neon-js` with `NeonAuthUIProvider`, `AuthView`, and `authClient.useSession()`.

## Goals / Non-Goals

**Goals:**
- Persistent top nav visible on every page
- Login modal via `?modal=login` search param (no full-page redirect for sign-in)
- `_auth` pathless layout that guards auth-required routes
- Skeleton pages for all planned routes so links resolve immediately
- Neon auth client wired end-to-end

**Non-Goals:**
- Implementing any feature page content (puzzles logic, game library queries, etc.)
- Backend changes
- User profile storage or progress tracking (future concern)

## Decisions

### Login modal vs dedicated `/auth` page
**Decision:** Modal dialog triggered by `?modal=login` search param, with `/auth/:pathname` route kept as fallback for Neon's email-verification redirects.

**Rationale:** The chess board and analysis pages are the entry point — users often arrive mid-session (shared game URL, puzzle link). A modal keeps context; a full redirect loses it. Speech-trainer used a dedicated page because it gates the entire app; chess-trainer is mostly public.

**Alternative considered:** Dedicated `/login` page. Rejected — full redirect breaks the "analyse this position" shareability story.

### Search param approach for modal state
**Decision:** `?modal=login` in the URL controls modal visibility. Root route declares it in `validateSearch`.

**Rationale:** URL-driven — back button closes the modal, the auth guard can throw `redirect({ to: '/', search: { modal: 'login' } })` and the modal opens automatically. No separate context/store needed for this one bit of UI state.

### `_auth` pathless layout for guarded routes
**Decision:** TanStack Router pathless layout route (`_auth.tsx` + `_auth/` directory). `beforeLoad` reads `authClient.getSession()` and redirects if unauthenticated.

**Rationale:** Centralises the guard. All current and future auth-required routes go under `_auth/` — one place to change the redirect target or add role checks later.

**Alternative considered:** Per-route `beforeLoad` guards. Rejected — duplicated logic, easy to forget on new routes.

### `authClient` as a module singleton
**Decision:** `src/lib/auth.ts` exports a single `authClient` instance (same pattern as speech-trainer).

**Rationale:** `createAuthClient` is stateful (manages token cache, session subscription). One instance across the app avoids double-subscription bugs.

### Skeleton pages as minimal placeholders
**Decision:** Each new route exports a single named component with a page title and "Coming soon" message. No feature imports.

**Rationale:** Routes need to resolve so nav links work and the router doesn't 404. Placeholder content is intentionally thin — future changes replace it entirely.

## Risks / Trade-offs

- **`routeTree.gen.ts` regeneration** → TanStack Router's Vite plugin auto-regenerates on `npm run dev`. The generated file must be committed. Risk: merge conflicts if two branches add routes simultaneously. Mitigation: this change adds all planned routes at once.
- **`?modal=login` persists in URL if user closes modal without signing in** → The modal close handler should call `navigate({ search: { modal: undefined } })` to clean the URL. Low risk — cosmetic only.
- **`NeonAuthUIProvider` must wrap `Outlet`** → If it wraps only parts of the tree, `AuthView` won't find its context. Ensure it's the outermost wrapper in `__root.tsx`.
- **`VITE_NEON_AUTH_URL` must be set in production** → Missing env var = auth client throws at import. Add to deployment env and document in `.env.example`.
