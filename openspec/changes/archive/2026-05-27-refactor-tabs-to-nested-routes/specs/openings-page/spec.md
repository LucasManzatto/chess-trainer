## MODIFIED Requirements

### Requirement: Openings route exists at /openings
A layout route SHALL exist at `/openings` defined in `src/routes/openings.tsx`. Navigating to `/openings` SHALL immediately redirect to `/openings/browse`. The layout SHALL render a tab nav with "Browse" and "Drill" tabs and an `<Outlet />` below. The page SHALL be publicly accessible and render without login. The layout component SHALL call `useFavorites` so both child tabs benefit from cached favorites.

#### Scenario: /openings redirects to /openings/browse
- **WHEN** the user navigates to `/openings`
- **THEN** the router immediately redirects to `/openings/browse` with no content flash

#### Scenario: /openings/browse renders browse tab
- **WHEN** the user navigates to `/openings/browse`
- **THEN** the openings layout renders with the Browse tab active and the BrowsePage content in the outlet

#### Scenario: /openings/drill renders drill tab
- **WHEN** the user navigates to `/openings/drill`
- **THEN** the openings layout renders with the Drill tab active and the DrillPage content in the outlet

#### Scenario: /openings accessible without login
- **WHEN** an unauthenticated user navigates to `/openings/browse`
- **THEN** the page renders normally (no auth redirect)

#### Scenario: Browse tab is the default
- **WHEN** the user navigates to `/openings` with no path suffix
- **THEN** the Browse tab is active after redirect

### Requirement: Browse tab route at /openings/browse
A page route SHALL exist at `/openings/browse` defined in `src/routes/openings/browse.tsx`. It SHALL render the full browse layout: openings list panel, board panel, move list panel, and notes panel. It SHALL declare `validateSearch` accepting `openingId` (optional number).

#### Scenario: openingId in URL pre-selects opening
- **WHEN** the user navigates to `/openings/browse?openingId=5`
- **THEN** opening with id 5 is selected and loaded on the board

#### Scenario: openingId not present on drill route
- **WHEN** the user clicks the Drill tab from `/openings/browse?openingId=5`
- **THEN** the URL becomes `/openings/drill` with no openingId param

### Requirement: Drill tab route at /openings/drill
A page route SHALL exist at `/openings/drill` defined in `src/routes/openings/drill.tsx`. It SHALL render the drill interface. Unauthenticated users SHALL see a sign-in prompt instead of the drill board.

#### Scenario: Unauthenticated user sees sign-in prompt on drill tab
- **WHEN** an unauthenticated user navigates to `/openings/drill`
- **THEN** a sign-in prompt renders instead of the drill queue
