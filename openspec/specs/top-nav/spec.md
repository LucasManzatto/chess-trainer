## ADDED Requirements

### Requirement: Top nav renders on every page
The app SHALL render a persistent top navigation bar on all routes. The nav SHALL be defined in `__root.tsx` and rendered above `<Outlet />`.

#### Scenario: Nav visible on free-play page
- **WHEN** the user visits `/`
- **THEN** the top nav is visible above the chess board

#### Scenario: Nav visible on skeleton pages
- **WHEN** the user visits any route (puzzles, openings, dashboard, games)
- **THEN** the top nav is visible at the top of the page

### Requirement: Nav links to all main sections
The top nav SHALL contain links to: Free Play (`/`), Puzzles (`/puzzles`), Openings (`/openings`), Dashboard (`/dashboard`), Games (`/games`). Active link SHALL be visually distinguished from inactive links. Each nav link SHALL restore the last known search params for its target route from `routeMemoryStore`, merging them with any global root-level params (e.g. `modal`) that must be preserved.

#### Scenario: Active link highlighted
- **WHEN** the user is on `/puzzles`
- **THEN** the Puzzles nav link appears highlighted/active and other links do not

#### Scenario: Nav link navigates correctly
- **WHEN** the user clicks the Openings nav link
- **THEN** the router navigates to `/openings` without a full page reload

#### Scenario: Nav link restores last search params
- **WHEN** the user was previously on `/openings/?tab=drill&openingId=42`, navigated away, and clicks the Openings nav link
- **THEN** the router navigates to `/openings/?tab=drill&openingId=42` restoring the previous state

#### Scenario: Nav link uses defaults on first visit
- **WHEN** the user has never visited `/openings/` and clicks the Openings nav link
- **THEN** the router navigates to `/openings/` with no search params, and route defaults apply

### Requirement: Nav right side is auth-aware
The right side of the nav SHALL show a "Sign In" button when the user is unauthenticated, and a user avatar or display name with an Account link when authenticated.

#### Scenario: Unauthenticated state shows Sign In
- **WHEN** `authClient.useSession()` returns no session
- **THEN** a "Sign In" button is visible on the right side of the nav

#### Scenario: Authenticated state shows user info
- **WHEN** `authClient.useSession()` returns a valid session with a user
- **THEN** the user's name or avatar is shown on the right side of the nav with an Account link

#### Scenario: Sign In button opens login modal
- **WHEN** the unauthenticated user clicks "Sign In"
- **THEN** the URL search param `modal=login` is set and the login modal opens
