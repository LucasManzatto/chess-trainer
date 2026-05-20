## 1. Install packages

- [x] 1.1 Install `@tanstack/react-router` as a dependency
- [x] 1.2 Install `@tanstack/router-vite-plugin` and `@tanstack/router-devtools` as dev dependencies

## 2. Configure vite plugin

- [x] 2.1 Import `TanStackRouterVite` from `@tanstack/router-vite-plugin` in `vite.config.ts` and add it to the `plugins` array

## 3. Create route files

- [x] 3.1 Create `src/routes/__root.tsx` — root layout component that renders `<Outlet />` from `@tanstack/react-router`
- [x] 3.2 Create `src/routes/index.tsx` — index route (`createFileRoute('/')`) with the free-play page content from `App.tsx`

## 4. Generate route tree and wire router

- [x] 4.1 Run `npm run dev` once to trigger the vite plugin and generate `src/routeTree.gen.ts`
- [x] 4.2 Create `src/router.ts` — call `createRouter({ routeTree })` using the generated `routeTree` from `routeTree.gen.ts`
- [x] 4.3 Update `src/main.tsx` — replace `<App />` with `<RouterProvider router={router} />`

## 5. Clean up

- [x] 5.1 Delete `src/App.tsx` (content now lives in `src/routes/index.tsx`)

## 6. Verify

- [x] 6.1 `npm run build` completes with no TypeScript errors
- [x] 6.2 Dev server: navigate to `/` — free-play page renders, moves work, keyboard history navigation works
- [x] 6.3 Navigate to an unknown path (e.g., `/foo`) — no white screen crash
