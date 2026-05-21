## ADDED Requirements

### Requirement: Games index route exists at /games and requires auth
A route SHALL exist at `/games` defined in `src/routes/_auth/games/index.tsx`, nested under the `_auth` layout. Unauthenticated users SHALL be redirected to `/?modal=login`.

#### Scenario: /games resolves for authenticated user
- **WHEN** an authenticated user navigates to `/games`
- **THEN** the games library page renders with the top nav visible

#### Scenario: /games redirects unauthenticated user
- **WHEN** an unauthenticated user navigates to `/games`
- **THEN** the router redirects to `/?modal=login`

### Requirement: Game detail route exists at /games/:gameId and requires auth
A route SHALL exist at `/games/:gameId` defined in `src/routes/_auth/games/$gameId.tsx`, nested under the `_auth` layout. The page SHALL have access to the `gameId` param.

#### Scenario: /games/:gameId resolves for authenticated user
- **WHEN** an authenticated user navigates to `/games/xyz`
- **THEN** the game detail page renders with the gameId param accessible and no 404
