## ADDED Requirements

### Requirement: Openings route exists at /openings
A route SHALL exist at `/openings` defined in `src/routes/openings/index.tsx`. The page SHALL be publicly accessible and render a placeholder UI.

#### Scenario: /openings resolves without 404
- **WHEN** the user navigates to `/openings`
- **THEN** the openings page renders with the top nav visible and no error

#### Scenario: /openings accessible without login
- **WHEN** an unauthenticated user navigates to `/openings`
- **THEN** the page renders normally (no auth redirect)
