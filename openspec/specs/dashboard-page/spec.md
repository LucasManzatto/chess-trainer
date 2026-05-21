## ADDED Requirements

### Requirement: Dashboard route exists at /dashboard and requires auth
A route SHALL exist at `/dashboard` defined in `src/routes/_auth/dashboard.tsx`, nested under the `_auth` pathless layout. Unauthenticated users SHALL be redirected to `/?modal=login`.

#### Scenario: /dashboard resolves for authenticated user
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the dashboard page renders with the top nav visible

#### Scenario: /dashboard redirects unauthenticated user
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** the router redirects to `/?modal=login`
