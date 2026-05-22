## MODIFIED Requirements

### Requirement: Openings route exists at /openings
A route SHALL exist at `/openings` defined in `src/routes/openings/index.tsx`. The page SHALL be publicly accessible and render a three-tab interface: Browse, Explore, and Drill. The page SHALL retain the top nav and be accessible without login (Browse and Explore tabs do not require authentication).

#### Scenario: /openings resolves without 404
- **WHEN** the user navigates to `/openings`
- **THEN** the openings page renders with the top nav visible and no error

#### Scenario: /openings accessible without login
- **WHEN** an unauthenticated user navigates to `/openings`
- **THEN** the page renders normally showing Browse and Explore tabs (no auth redirect)

#### Scenario: Three tabs render
- **WHEN** the openings page loads
- **THEN** three tabs are visible: "Browse", "Explore", and "Drill"

#### Scenario: Browse tab is the default
- **WHEN** the user navigates to /openings with no tab parameter
- **THEN** the Browse tab is active by default
