## Why

The app currently has no routing — everything lives on a single unnamed page. Analysis mode, puzzle mode, and opening explorer are all planned; without a router they can't exist as separate pages. TanStack Router is the project's chosen routing library and should be wired in before any new modes are added.

## What Changes

- Install `@tanstack/react-router`, `@tanstack/router-vite-plugin`, and `@tanstack/router-devtools`
- Add TanStack Router vite plugin to `vite.config.ts` (generates `routeTree.gen.ts`)
- Create file-based route structure under `src/routes/`
- Create `__root.tsx` root layout with `<Outlet />`
- Move free-play page content from `App.tsx` to `src/routes/index.tsx`
- Wire `RouterProvider` in `main.tsx`
- Delete `App.tsx` (content absorbed into index route)

## Capabilities

### New Capabilities
- `routing`: Client-side routing via TanStack Router; defines the route tree, root layout, and the `/` free-play route

### Modified Capabilities

## Impact

- `frontend/vite.config.ts`: add router plugin
- `frontend/src/main.tsx`: replace `<App />` with `<RouterProvider>`
- `frontend/src/App.tsx`: deleted
- `frontend/src/routes/`: new directory with `__root.tsx` and `index.tsx`
- `frontend/src/routeTree.gen.ts`: auto-generated, committed
- New dev dependencies: `@tanstack/react-router`, `@tanstack/router-vite-plugin`, `@tanstack/router-devtools`
- No behavior changes — free-play page works identically after migration
