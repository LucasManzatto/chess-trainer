## Why

Users study many openings but want to focus on a curated subset. Without favorites, there's no way to mark or filter down to the openings that matter most to a given player.

## What Changes

- Add a star/heart toggle on each opening in BrowseTab and ExploreTab lists
- Allow favoriting an entire trie branch (a parent node favorites all its descendants)
- Add a "Favorites only" filter toggle in OpeningsList header
- Favorites persist per-user in the backend (new `opening_favorites` table)
- Favorited openings are visually distinguished in all three view modes (list, name tree, move tree)

## Capabilities

### New Capabilities

- `opening-favorites`: Favorite individual openings or entire trie branches, persist favorites per-user, filter the openings list to show only favorites

### Modified Capabilities

- `opening-browse`: OpeningsList gains a favorites filter toggle and per-item favorite button

## Impact

- **Backend**: New `opening_favorites` table, new migration, new service + 2 endpoints (toggle, list)
- **Frontend**: `useOpenings` hook gains favorite state; `OpeningsList`, `OpeningsNameTree`, `OpeningsMoveTree` gain favorite UI; `useBrowseTab` gains filter state
- **API**: `POST /openings/{id}/favorite` (toggle), `GET /openings/favorites`
