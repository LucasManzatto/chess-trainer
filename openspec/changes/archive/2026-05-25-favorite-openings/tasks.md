## 1. Backend: Database

- [x] 1.1 Create migration `backend/migrations/002_opening_favorites.sql` with `opening_favorites (user_id, opening_id PK)` table and index
- [x] 1.2 Add `OpeningFavorite` SQLAlchemy model to `backend/src/app/models/openings.py`

## 2. Backend: API

- [x] 2.1 Add `FavoriteResponse` schema (`{ opening_id: int, is_favorite: bool }`) to `backend/src/app/schemas/openings.py`
- [x] 2.2 Create `backend/src/app/services/favorites.py` with `toggle_favorite` and `list_favorites` functions
- [x] 2.3 Add `GET /openings/favorites` endpoint returning `list[int]` (favorite opening IDs) to `backend/src/app/api/v1/openings.py`
- [x] 2.4 Add `POST /openings/{id}/favorite` toggle endpoint returning `FavoriteResponse`

## 3. Frontend: Favorites Store

- [x] 3.1 Create `frontend/src/features/openings/stores/useFavoritesStore.ts` — Zustand store with `ids: Set<number>`, `isLoaded: boolean`, `toggle(id)`, `setAll(ids)`
- [x] 3.2 Create `frontend/src/features/openings/hooks/useFavorites.ts` — fetches `GET /openings/favorites` on mount (authenticated only), populates store; exposes `toggle(id)` with optimistic update

## 4. Frontend: OpeningsList Filter

- [x] 4.1 Add favorites filter toggle button to `OpeningsList` header (star icon, next to view mode buttons)
- [x] 4.2 Apply `showFavoritesOnly` filter to `openings` array inside `OpeningsList` before passing to sub-renderers

## 5. Frontend: Favorite Icons in Views

- [x] 5.1 Add star icon to each item in list view (`OpeningsList.tsx`) — clicking star calls `toggle(id)`, does not trigger `onSelect`
- [x] 5.2 Add star icon to `OpeningsNameTree` leaf and parent nodes — parent shows filled/dim/empty based on descendant favorite ratio; clicking star on parent bulk-toggles all descendants
- [x] 5.3 Add star icon to `OpeningsMoveTree` move nodes — same bulk-toggle logic for all openings reachable from that node

## 6. Frontend: Wiring

- [x] 6.1 Call `useFavorites()` at the openings page/layout level so favorites load once
- [x] 6.2 Verify filter + search + view mode combinations work correctly in BrowseTab and ExploreTab
