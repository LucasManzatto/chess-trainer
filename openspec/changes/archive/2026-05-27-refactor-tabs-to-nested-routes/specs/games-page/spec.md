## MODIFIED Requirements

### Requirement: Games index route exists at /games and requires auth
A layout route SHALL exist at `/games` defined in `src/routes/_auth/games.tsx`, nested under the `_auth` layout. Navigating to `/games` SHALL immediately redirect to `/games/list`. The layout SHALL render a tab nav with "Games" and "Dashboard" tabs and an `<Outlet />` below. Unauthenticated users SHALL be redirected by the `_auth` layout. When the authenticated user has no `chess_com_username` set, the layout SHALL render the first-run setup prompt instead of the tab nav and outlet.

#### Scenario: /games redirects to /games/list
- **WHEN** an authenticated user with a username navigates to `/games`
- **THEN** the router immediately redirects to `/games/list`

#### Scenario: /games redirects unauthenticated user
- **WHEN** an unauthenticated user navigates to `/games`
- **THEN** the router redirects to `/?modal=login`

#### Scenario: First-run prompt shown when no username set
- **WHEN** an authenticated user with no `chess_com_username` navigates to `/games`
- **THEN** the setup prompt renders (no tab nav, no redirect to /games/list)

#### Scenario: Setup prompt saves username and transitions to games list
- **WHEN** a user enters a chess.com username in the first-run prompt and submits
- **THEN** the username is saved and the router navigates to `/games/list`

### Requirement: Games list route at /games/list
A page route SHALL exist at `/games/list` defined in `src/routes/_auth/games/list.tsx`. It SHALL render the full 4-column layout: games list panel, board panel, move list panel, and analysis panel. It SHALL declare `validateSearch` accepting `result` (enum: win/loss/draw, nullable, default null), `color` (enum: white/black, nullable, default null), `time_class` (enum: bullet/blitz/rapid/daily, nullable, default null), `eco` (string, default ''), and `gameId` (optional number). All fields SHALL use `.catch(default)`.

#### Scenario: Filter params survive page refresh
- **WHEN** the user sets `result=win&color=white` on `/games/list` and refreshes
- **THEN** the games list renders with both filters active

#### Scenario: Selected game survives page refresh
- **WHEN** the user selects a game (gameId=42) and refreshes
- **THEN** the same game is re-selected

#### Scenario: Invalid stored params degrade gracefully
- **WHEN** localStorage contains `time_class=invalid_value`
- **THEN** `time_class` falls back to null without a runtime error

#### Scenario: Sync button triggers sync and shows progress
- **WHEN** the user clicks the Sync button
- **THEN** sync starts and shows progress until complete

### Requirement: Games route encodes filters and selected game in URL search params
The `/games/list` route SHALL own all filter and selection search params. These params SHALL NOT be declared on the `/games` layout route.

#### Scenario: Changing filter updates URL
- **WHEN** the user changes the result filter to "win"
- **THEN** the URL updates to `/games/list?result=win`

### Requirement: Game detail route exists at /games/:gameId and requires auth
A route SHALL exist at `/games/:gameId` defined in `src/routes/_auth/games/$gameId.tsx`, nested under the `_auth` layout and the `games` layout. The page SHALL have access to the `gameId` param. The games tab nav shell SHALL be visible on this route.

#### Scenario: /games/:gameId resolves for authenticated user
- **WHEN** an authenticated user navigates to `/games/xyz`
- **THEN** the game detail page renders with the gameId param accessible and no 404

### Requirement: Dashboard route at /games/dashboard
A page route SHALL exist at `/games/dashboard` defined in `src/routes/_auth/games/dashboard.tsx`. It SHALL render a placeholder until the dashboard feature is built.

#### Scenario: /games/dashboard renders without error
- **WHEN** an authenticated user with a username navigates to `/games/dashboard`
- **THEN** the dashboard tab is active and the page renders without error
