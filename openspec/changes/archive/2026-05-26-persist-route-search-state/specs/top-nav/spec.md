## MODIFIED Requirements

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
