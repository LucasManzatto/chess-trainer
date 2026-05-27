## Context

No E2E test infrastructure exists. The frontend has Vitest for unit tests (pure logic only). Three public routes — Free Play (`/`), Openings (`/openings`), Puzzles (`/puzzles`) — require zero backend: Free Play is pure chess.js, Openings loads from `/public/openings.json` (static asset), Puzzles is a placeholder. This makes them ideal candidates for a low-friction E2E baseline with no service orchestration.

## Goals / Non-Goals

**Goals:**
- Install and configure Playwright within the `frontend/` package
- Wire `webServer` so `npm run test:e2e` starts Vite automatically
- Cover the happy path of all three public routes
- Establish selector patterns for Chessground board interaction

**Non-Goals:**
- Auth-gated routes (Games, Dashboard, Account) — deferred
- Backend mocking or test doubles — not needed for these routes
- Visual regression / screenshot testing
- CI pipeline integration (local dev only for now)

## Decisions

### 1. Playwright over Cypress

Playwright has better Vite/ESM support, ships with a built-in `webServer` that handles dev server lifecycle, and has native TypeScript without extra config. Cypress would need additional setup for ESM and the Vite dev server.

**Alternative considered:** Cypress — rejected due to ESM friction and heavier setup.

### 2. Tests live in `frontend/e2e/`, config at `frontend/playwright.config.ts`

Keeps E2E tests co-located with the frontend. `playwright.config.ts` at `frontend/` root means `npm run test:e2e` from `frontend/` works without path gymnastics.

**Alternative considered:** Root-level `e2e/` dir — rejected because it would sit outside the package that owns the dev server config and deps.

### 3. `webServer.reuseExistingServer: !process.env.CI`

In local dev, if port 5173 is already up, Playwright reuses it (fast). In CI, always start fresh (deterministic). This is the standard Playwright pattern.

### 4. Chessground square selectors via `[data-key]` attribute

Chessground (v10) renders interactive squares as `<square data-key="e2">` elements inside `<cg-board>`. Clicks target `cg-board [data-key="e2"]` then `cg-board [data-key="e4"]`. This is stable across board orientation changes (data-key is always algebraic notation).

**Alternative considered:** Coordinate-based clicks (`page.mouse.click(x, y)`) — rejected as brittle when board size changes.

**Verification step:** First task is to run `page.pause()` against a running dev server and confirm the `data-key` attribute exists. If it doesn't, fall back to class-based selectors (`square.e2`).

### 5. No API mocking

All three public routes work without the backend. No `page.route()` interceptors needed. Tests are pure UI — navigate, interact, assert DOM.

## Risks / Trade-offs

- **Chessground selector assumption** → Mitigation: First task verifies selectors before writing tests. If `data-key` is absent, adjust to whatever attribute Chessground v10 actually emits.
- **Stockfish WASM in Free Play** → Eval bar may throw without COEP/COOP headers. Tests don't assert on eval values — only board state and move list. Engine errors are tolerated.
- **Openings list load time** → 1MB `openings.json` may be slow on first load. Use `waitFor` with a generous timeout (10s) rather than fixed delays.
- **Flakiness from animation** → Chessground animates piece moves. Use `waitFor` on the move list entry appearing rather than asserting board state immediately after click.
