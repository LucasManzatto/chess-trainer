## Requirements

### Requirement: Tab sections use TanStack Router nested routes
Each multi-tab section of the app SHALL use a layout route (parent file + child directory pair) where the parent renders the tab nav and `<Outlet />`, and each child route is one tab page. The `tab` search param pattern SHALL NOT be used for tab navigation — switching tabs SHALL be a route navigation.

#### Scenario: Navigating to a tab changes the URL path
- **WHEN** the user clicks a tab (e.g., "Drill")
- **THEN** the URL changes to the tab's path (e.g., `/openings/drill`) and the browser history entry is created

#### Scenario: Active tab reflects current URL path
- **WHEN** the user is on `/openings/browse`
- **THEN** the "Browse" tab is highlighted as active based on pathname, not a search param

#### Scenario: Browser back navigates between tabs
- **WHEN** the user navigates browse → drill → presses browser back
- **THEN** the URL returns to `/openings/browse` and the Browse tab content renders

### Requirement: Layout route provides shared tab nav UI
The layout route component SHALL render the tab nav bar and an `<Outlet />`. Shared state or side-effects needed by all tabs in a section (e.g., `useFavorites` for openings) SHALL be initialized in the layout component.

#### Scenario: Tab nav persists across tab switches
- **WHEN** the user switches between tabs
- **THEN** the tab nav bar remains mounted and visible without re-mounting

#### Scenario: Shared side-effects run once per section visit
- **WHEN** the user enters the openings section (either tab)
- **THEN** `useFavorites` is called exactly once at the layout level, not per tab

### Requirement: Index routes redirect to the default tab
Each section's index route (`/openings`, `/games`) SHALL redirect to the default tab path (`/openings/browse`, `/games/list`). The redirect SHALL be immediate with no content flash.

#### Scenario: /openings redirects to /openings/browse
- **WHEN** the user navigates to `/openings`
- **THEN** the router immediately redirects to `/openings/browse`

#### Scenario: /games redirects to /games/list
- **WHEN** the user navigates to `/games`
- **THEN** the router immediately redirects to `/games/list`

### Requirement: Each tab route owns its own search param schema
Each tab page route SHALL declare its own `validateSearch` schema containing only the params relevant to that tab. Search params SHALL NOT be shared across sibling tab routes.

#### Scenario: Browse tab params not present on drill tab URL
- **WHEN** the user navigates from `/openings/browse?openingId=5` to `/openings/drill`
- **THEN** the drill URL has no `openingId` param and drill renders without error

#### Scenario: Games list filter params survive refresh
- **WHEN** the user sets `result=win` on `/games/list` and refreshes
- **THEN** `/games/list?result=win` re-renders with the win filter active
