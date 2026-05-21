## 1. Dependencies & Env

- [x] 1.1 Add `@neondatabase/neon-js` to `frontend/package.json` and run `npm install`
- [x] 1.2 Add `VITE_NEON_AUTH_URL` to `frontend/.env` (copy value from speech-trainer or Neon console)
- [x] 1.3 Add `VITE_NEON_AUTH_URL=` placeholder to `frontend/.env.example` (if file exists)

## 2. Auth Client

- [x] 2.1 Create `frontend/src/lib/auth.ts` — export `authClient` using `createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, { adapter: BetterAuthReactAdapter() })`

## 3. Root Layout

- [x] 3.1 Rewrite `__root.tsx` — wrap outlet with `NeonAuthUIProvider` (pass `authClient` + TanStack `navigate` adapter)
- [x] 3.2 Add `validateSearch` to root route — accept `{ modal?: 'login' }`
- [x] 3.3 Build `TopNav` component — links (Free Play, Puzzles, Openings, Dashboard, Games) with active link highlight using TanStack Router's `Link` + `useRouterState`
- [x] 3.4 Add auth-aware right side to `TopNav` — `authClient.useSession()`: unauthenticated → "Sign In" button sets `?modal=login`; authenticated → user name/avatar + Account link
- [x] 3.5 Build `LoginModal` component — Radix UI `Dialog`, reads `modal` search param, renders `<AuthView pathname="sign-in" />`, close handler clears param
- [x] 3.6 Render `TopNav` and `LoginModal` in root layout component

## 4. Auth Guard

- [x] 4.1 Create `frontend/src/routes/_auth.tsx` — pathless layout with `beforeLoad` that calls `authClient.getSession()` and throws `redirect({ to: '/', search: { modal: 'login' } })` if no session; renders `<Outlet />`

## 5. Skeleton Pages

- [x] 5.1 Create `frontend/src/routes/puzzles/index.tsx` — public, placeholder "Puzzles — Coming soon"
- [x] 5.2 Create `frontend/src/routes/puzzles/$puzzleId.tsx` — public, displays `puzzleId` param in placeholder
- [x] 5.3 Create `frontend/src/routes/openings/index.tsx` — public, placeholder "Openings — Coming soon"
- [x] 5.4 Create `frontend/src/routes/_auth/dashboard.tsx` — auth-required skeleton, placeholder "Dashboard — Coming soon"
- [x] 5.5 Create `frontend/src/routes/_auth/games/index.tsx` — auth-required skeleton, placeholder "Games — Coming soon"
- [x] 5.6 Create `frontend/src/routes/_auth/games/$gameId.tsx` — auth-required skeleton, displays `gameId` param in placeholder

## 6. Neon Auth/Account Pages

- [x] 6.1 Create `frontend/src/routes/auth/$pathname.tsx` — renders `<AuthView pathname={pathname} redirectTo="/" />` centered on page (handles email verification redirects)
- [x] 6.2 Create `frontend/src/routes/account/$pathname.tsx` — renders `<AccountView pathname={pathname} />` centered on page

## 7. Verify

- [x] 7.1 Run `npm run dev` — confirm `routeTree.gen.ts` regenerates with all new routes, no TypeScript errors
- [ ] 7.2 Verify all nav links resolve (no 404s), active link highlights correctly
- [ ] 7.3 Verify `?modal=login` opens modal, closing clears param
- [ ] 7.4 Verify unauthenticated access to `/dashboard` and `/games` redirects to `/?modal=login`
- [ ] 7.5 Verify authenticated session shows user info in nav and passes through to protected routes
