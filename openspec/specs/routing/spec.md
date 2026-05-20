### Requirement: App uses TanStack Router for client-side navigation
The app SHALL use TanStack Router v1 with file-based routing. The route tree SHALL be auto-generated from `src/routes/` by the vite plugin and committed as `src/routeTree.gen.ts`. `main.tsx` SHALL render `<RouterProvider router={router} />` as the root.

#### Scenario: App boots at root path
- **WHEN** the user navigates to `/`
- **THEN** the free-play page renders with the chess board and move list

#### Scenario: Unknown path renders not-found
- **WHEN** the user navigates to an unrecognised path
- **THEN** TanStack Router renders its default not-found behaviour (no white screen)

### Requirement: Root layout wraps all routes
A `__root.tsx` file SHALL define the root layout component. It SHALL render `<Outlet />` so child routes mount inside it. No visible UI chrome is added at this stage.

#### Scenario: Root layout mounts child route
- **WHEN** any route is active
- **THEN** the root layout's `<Outlet />` renders that route's component

### Requirement: Free-play page is the index route
The free-play page (chess board + move list) SHALL be the index route at `/`, defined in `src/routes/index.tsx`. All existing free-play functionality SHALL be preserved unchanged.

#### Scenario: Free-play page behaviour unchanged after migration
- **WHEN** the user visits `/` and plays moves
- **THEN** the board accepts moves, the move list updates, and keyboard history navigation works identically to before the migration
