## Context

Openings are stored in `openings.json` (static, ~3000 entries) loaded by `useOpenings`. User-specific data (drill progress, comments) lives in PostgreSQL with `user_id` keys via `X-User-Id` header auth. The frontend already has a favorites pattern precedent from `OpeningProgress`. The list UI has three view modes (list, name tree, move tree) — all must show favorite state.

## Goals / Non-Goals

**Goals:**
- Persist favorites per-user in backend
- Toggle single opening favorite from any view mode
- Bulk-favorite all openings under a name-tree or move-tree node
- Filter openings list to favorites only
- Optimistic UI updates (star toggles immediately, rolls back on error)

**Non-Goals:**
- Favorite ordering / ranking
- Sharing favorites between users
- Favoriting positions (FEN-level), only full openings

## Decisions

**1. Backend: new `opening_favorites` table, not a column on `opening_progress`**
Favorites are independent of drill state — a user may favorite an opening without drilling it. Keeping them separate avoids nullable columns and a misleading join.

**2. Toggle endpoint, not separate add/delete**
`POST /openings/{id}/favorite` returns `{ is_favorite: bool }`. Single endpoint, idempotent. Matches the drill `add_to_drill` pattern already in this codebase.

**3. Frontend: Zustand store for favorite IDs (`Set<number>`)**
Favorites are client UI state that needs to survive tab switches without refetching. A Zustand store initialized from `GET /openings/favorites` on mount fits the existing pattern (`useOpenings` already separates data loading from UI state). The store exposes `toggle(id)` with optimistic update.

**4. Bulk-favorite via trie/name-tree: collect all descendant opening IDs, fire parallel toggles**
No bulk backend endpoint — the number of openings under a node is bounded (~10-50 typically). Parallel `Promise.all` with individual toggles keeps the backend simple and reuses existing logic.

**5. Filter toggle lives inside `OpeningsList`**
The filter state (`showFavoritesOnly: boolean`) belongs in `OpeningsList` alongside the existing `viewMode` toggle. It does not need to propagate upward — `OpeningsList` filters the `openings` prop before passing to sub-renderers.

## Risks / Trade-offs

**Many parallel toggle requests on bulk-favorite** → Mitigation: bounded by trie size, acceptable for now. Add a bulk endpoint later if needed.

**Zustand store initialized async** → Brief flash where no favorites are marked. Mitigation: show skeleton/no favorite markers until loaded (store tracks `isLoaded` flag).

**Filter + search interaction** → Filter applies after search (favorites filter on already-searched results). This is intuitive: search narrows, then filter further.

## Migration Plan

1. Add migration `002_opening_favorites.sql`
2. Deploy backend (additive, no breaking changes)
3. Deploy frontend
4. Rollback: drop table, revert frontend — no data loss risk to existing tables
