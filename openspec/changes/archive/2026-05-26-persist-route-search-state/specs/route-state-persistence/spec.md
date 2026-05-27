## ADDED Requirements

### Requirement: Route memory store persists last search params per pathname
The app SHALL maintain a `routeMemoryStore` (Zustand + localStorage `persist` middleware) that maps each visited route's pathname to its last known search params object. The store SHALL be keyed by pathname string (e.g. `/openings/`, `/_auth/games/`).

#### Scenario: Store saves params on navigation
- **WHEN** the user navigates to any route
- **THEN** the store records that route's `pathname` → `search` entry in localStorage

#### Scenario: Stored params survive page refresh
- **WHEN** the user refreshes the browser
- **THEN** the store rehydrates from localStorage and last known params are available

#### Scenario: Unknown route has no stored entry
- **WHEN** a route is visited for the first time
- **THEN** the store returns `undefined` for that pathname

### Requirement: Router auto-saves search params via subscription
The router SHALL subscribe to its `onResolved` event at app boot. On every successful navigation, it SHALL call `routeMemoryStore.save(pathname, search)` with the resolved location's pathname and search object.

#### Scenario: Auto-save on every navigation
- **WHEN** the router resolves any navigation (link click, programmatic navigate, or back/forward)
- **THEN** the resolved route's search params are written to the store without any per-route code

#### Scenario: New routes saved automatically
- **WHEN** a new route is added to the app and the user visits it
- **THEN** its search params are saved to the store with no changes to the route file
