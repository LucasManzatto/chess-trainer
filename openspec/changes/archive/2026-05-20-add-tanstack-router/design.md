## Context

`main.tsx` renders `<App />` directly — no router, no routes, no URL-based navigation. `App.tsx` owns the free-play page layout. Adding a second mode (analysis, puzzles) is impossible without a router. TanStack Router v1 is the project's chosen solution; this change wires it in with zero behavior changes to the free-play page.

## Goals / Non-Goals

**Goals:**
- Install and configure TanStack Router with file-based routing
- Migrate free-play page to `src/routes/index.tsx`
- Establish root layout for future nav bar slot
- Keep the change a pure infrastructure migration — no behavior changes

**Non-Goals:**
- Adding a nav bar or any UI chrome (no second route exists yet)
- Adding TanStack Query (separate change)
- Adding Zustand (separate change)
- Any new routes beyond `/`

## Decisions

### File-based routing with `@tanstack/router-vite-plugin`

The vite plugin watches `src/routes/` and auto-generates `routeTree.gen.ts`. Routes are discovered from file names following TanStack Router conventions (`__root.tsx`, `index.tsx`, `about.tsx`, `posts.$id.tsx`, etc.). This gives full type safety on `<Link to="...">` and `useNavigate()` with zero boilerplate.

Alternatives considered:
- **Code-based routing** (manual `createRoute` calls): more explicit but verbose; every new route requires touching a central file. File-based scales better.
- **React Router**: not the project's chosen library.

### `routeTree.gen.ts` committed to git

The generated file is committed so CI doesn't need a codegen step and editors get instant type information without running the dev server first.

Alternatives considered:
- Gitignore it, regenerate in CI: adds CI step complexity; worse editor DX on fresh clone.

### `__root.tsx` as passthrough layout

Root layout renders only `<Outlet />` for now. When a nav bar is added (once a second route exists), it slots here. Adding it now avoids retroactively threading navigation through a non-layout component.

### `App.tsx` deleted, not kept as layout

The current `App.tsx` becomes `routes/index.tsx` verbatim. Keeping `App.tsx` as an alias or re-export creates confusion about where page logic lives. Clean deletion is clearer.

## Risks / Trade-offs

- `routeTree.gen.ts` regenerates on every dev-server start → merge conflicts possible if two branches add routes simultaneously. Mitigation: treat it as a generated file; always regenerate rather than hand-editing.
- File-based routing conventions (`_layout`, `$param`, etc.) need to be learned. Mitigation: documented in TanStack Router docs; conventions are simple for the current route count.

## Migration Plan

1. Install packages
2. Add vite plugin → run `vite dev` once to generate `routeTree.gen.ts`
3. Create `src/routes/__root.tsx` and `src/routes/index.tsx`
4. Update `main.tsx`
5. Delete `App.tsx`
6. Verify dev server, build, and free-play page work identically
