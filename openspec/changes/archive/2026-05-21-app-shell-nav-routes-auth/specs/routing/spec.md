## MODIFIED Requirements

### Requirement: Root layout wraps all routes
A `__root.tsx` file SHALL define the root layout component. It SHALL wrap `<Outlet />` with `NeonAuthUIProvider` (passing `authClient` and a TanStack Router `navigate` adapter). It SHALL render the `TopNav` component above `<Outlet />`. It SHALL render a `LoginModal` conditionally based on the `modal` search param. The `TanStackRouterDevtools` SHALL remain in development builds.

#### Scenario: Root layout mounts child route
- **WHEN** any route is active
- **THEN** the root layout's `<Outlet />` renders that route's component

#### Scenario: NeonAuthUIProvider wraps outlet
- **WHEN** the app boots
- **THEN** `NeonAuthUIProvider` is the outermost wrapper so all child routes can use Neon auth UI components

#### Scenario: Root layout search params include modal
- **WHEN** the root route is mounted
- **THEN** `validateSearch` accepts `{ modal?: 'login' }` and makes it available via `useSearch()`
