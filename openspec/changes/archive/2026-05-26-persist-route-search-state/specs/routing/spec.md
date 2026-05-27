## MODIFIED Requirements

### Requirement: App uses TanStack Router for client-side navigation
The app SHALL use TanStack Router v1 with file-based routing. The route tree SHALL be auto-generated from `src/routes/` by the vite plugin and committed as `src/routeTree.gen.ts`. `main.tsx` SHALL render `<RouterProvider router={router} />` as the root. The router SHALL subscribe to its `onResolved` event immediately after creation to feed the `routeMemoryStore` with every resolved location's pathname and search params.

#### Scenario: App boots at root path
- **WHEN** the user navigates to `/`
- **THEN** the free-play page renders with the chess board and move list

#### Scenario: Unknown path renders not-found
- **WHEN** the user navigates to an unrecognised path
- **THEN** TanStack Router renders its default not-found behaviour (no white screen)

#### Scenario: Router subscriber saves params on every navigation
- **WHEN** the router resolves any navigation
- **THEN** `routeMemoryStore.save` is called with the resolved pathname and search object
