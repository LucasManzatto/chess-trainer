## MODIFIED Requirements

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
