## ADDED Requirements

### Requirement: Pathless _auth layout guards protected routes
A `_auth.tsx` pathless layout route SHALL wrap all auth-required routes. Its `beforeLoad` SHALL call `authClient.getSession()` and throw a redirect to `/?modal=login` if no session exists. It SHALL not contribute a URL segment.

#### Scenario: Unauthenticated user redirected
- **WHEN** a user with no session navigates to any route under `_auth/` (dashboard, games, games/:id)
- **THEN** TanStack Router's `beforeLoad` throws a redirect to `/?modal=login`

#### Scenario: Authenticated user passes through
- **WHEN** a user with a valid session navigates to `/dashboard`
- **THEN** the dashboard page renders normally with no redirect

#### Scenario: _auth adds no URL segment
- **WHEN** the user navigates to `/dashboard`
- **THEN** the URL is `/dashboard`, not `/_auth/dashboard`

### Requirement: Protected routes are nested under _auth
The routes `/dashboard`, `/games`, and `/games/:gameId` SHALL be defined as children of the `_auth` pathless layout in the file-based route tree (`_auth/` directory).

#### Scenario: Dashboard route resolves through _auth layout
- **WHEN** the user visits `/dashboard` while authenticated
- **THEN** the `_auth` layout's `<Outlet />` renders the dashboard component
