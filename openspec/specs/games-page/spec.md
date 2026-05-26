## ADDED Requirements

### Requirement: Games index route exists at /games and requires auth
A route SHALL exist at `/games` defined in `src/routes/_auth/games/index.tsx`, nested under the `_auth` layout. Unauthenticated users SHALL be redirected to `/?modal=login`. When the authenticated user has no `chess_com_username` set, the route SHALL render a first-run setup prompt instead of the games list. When the user has a username set, the route SHALL render the full Games tab with a 4-column layout: games list panel, board panel, move list panel, and analysis placeholder panel.

#### Scenario: /games resolves for authenticated user
- **WHEN** an authenticated user navigates to `/games`
- **THEN** the games library page renders with the top nav visible

#### Scenario: /games redirects unauthenticated user
- **WHEN** an unauthenticated user navigates to `/games`
- **THEN** the router redirects to `/?modal=login`

#### Scenario: First-run prompt shown when no username set
- **WHEN** an authenticated user with no `chess_com_username` navigates to `/games`
- **THEN** a setup prompt is displayed asking the user to enter their chess.com username

#### Scenario: Setup prompt saves username and transitions to games tab
- **WHEN** a user enters a chess.com username in the first-run prompt and submits
- **THEN** the username is saved and the full games tab layout renders

#### Scenario: Sync button triggers sync and shows progress
- **WHEN** an authenticated user with a username set clicks the "Sync" button
- **THEN** the sync starts, the button shows a loading/progress state, and updates until sync completes

#### Scenario: Games tab shows game list after sync
- **WHEN** sync completes and the user has games in the database
- **THEN** the games list panel shows all synced games ordered by most recent first

### Requirement: Games route encodes filters and selected game in URL search params
The games route SHALL declare a `validateSearch` schema with fields: `result` (enum: win/loss/draw, nullable, default null), `color` (enum: white/black, nullable, default null), `time_class` (enum: bullet/blitz/rapid/classical, nullable, default null), `eco` (string, default ''), and `gameId` (optional number). All fields SHALL use `.catch(default)` so stale or invalid localStorage values degrade to defaults without throwing.

#### Scenario: Filters survive page refresh
- **WHEN** the user sets result=win, color=white, then refreshes the page
- **THEN** the games list renders with result=win and color=white filters active

#### Scenario: Selected game survives page refresh
- **WHEN** the user selects a game and refreshes the page
- **THEN** the same game is re-selected and loaded on the board (if still present in the filtered list)

#### Scenario: Invalid stored params degrade gracefully
- **WHEN** localStorage contains `time_class=invalid_value` from a previous schema version
- **THEN** `time_class` falls back to null without a runtime error

#### Scenario: Changing filter updates URL
- **WHEN** the user changes the result filter to "win"
- **THEN** the URL updates to include `?result=win` and the games list re-fetches

### Requirement: Game detail route exists at /games/:gameId and requires auth
A route SHALL exist at `/games/:gameId` defined in `src/routes/_auth/games/$gameId.tsx`, nested under the `_auth` layout. The page SHALL have access to the `gameId` param.

#### Scenario: /games/:gameId resolves for authenticated user
- **WHEN** an authenticated user navigates to `/games/xyz`
- **THEN** the game detail page renders with the gameId param accessible and no 404
