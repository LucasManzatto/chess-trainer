## Requirements

### Requirement: Favorite a single opening
Users SHALL be able to toggle an opening as a favorite from the openings list. Favorites SHALL be persisted per-user in the backend. The favorite state SHALL be reflected immediately (optimistic update) and rolled back if the request fails.

#### Scenario: Toggle favorite on
- **WHEN** the user clicks the favorite icon on an unfavorited opening
- **THEN** the icon shows as active immediately and a POST to `/openings/{id}/favorite` is sent

#### Scenario: Toggle favorite off
- **WHEN** the user clicks the favorite icon on a favorited opening
- **THEN** the icon shows as inactive immediately and the change is persisted to the backend

#### Scenario: Optimistic rollback on error
- **WHEN** the toggle request fails
- **THEN** the favorite icon reverts to its previous state and an error is surfaced

### Requirement: Favorite an entire tree branch
Users SHALL be able to favorite all openings under a parent node in the name tree or move tree with a single action. The bulk action SHALL apply the majority state (if >50% are already favorited, unfavorite all; otherwise favorite all).

#### Scenario: Bulk favorite name-tree node
- **WHEN** the user activates the bulk-favorite action on a parent node in the name tree
- **THEN** all descendant openings are toggled to the resolved state in parallel

#### Scenario: Bulk favorite move-tree node
- **WHEN** the user activates the bulk-favorite action on a move node in the move tree
- **THEN** all openings reachable from that node are toggled to the resolved state

#### Scenario: Bulk partial state resolves to favorite all
- **WHEN** a parent node has 2 of 5 descendants favorited and the user triggers bulk-favorite
- **THEN** all 5 become favorited

### Requirement: Persist and load favorites
The backend SHALL store favorites in an `opening_favorites` table keyed by `(user_id, opening_id)`. On app load, the frontend SHALL fetch all favorite IDs for the current user and populate the favorites store.

#### Scenario: Favorites load on mount
- **WHEN** the openings page mounts and the user is authenticated
- **THEN** a GET to `/openings/favorites` is made and the returned IDs populate the store

#### Scenario: Favorites survive page refresh
- **WHEN** the user refreshes the page
- **THEN** their previously favorited openings are still shown as favorited after load

#### Scenario: Unauthenticated user sees no favorites
- **WHEN** the user is not authenticated
- **THEN** no favorites request is made and the favorites store remains empty
