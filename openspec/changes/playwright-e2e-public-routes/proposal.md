## Why

No E2E tests exist — only unit tests for pure logic. Regressions in UI flows (board interaction, openings search, routing) are invisible until manual testing. Public routes need zero backend, making them the lowest-friction starting point.

## What Changes

- Install Playwright and configure it to run against Vite dev server
- Add `frontend/playwright.config.ts` with `webServer` auto-start
- Add `frontend/e2e/free-play.spec.ts` — board renders, piece moves via Chessground DOM
- Add `frontend/e2e/openings.spec.ts` — search, select opening, board updates
- Add `frontend/e2e/puzzles.spec.ts` — smoke test (route renders, no crash)
- Add npm script `test:e2e` to `frontend/package.json`

## Capabilities

### New Capabilities

- `e2e-test-infrastructure`: Playwright config, webServer wiring, npm script, test runner setup
- `e2e-free-play`: E2E happy path for Free Play — board renders and accepts moves
- `e2e-openings-browse`: E2E happy path for Openings Browse — search, select, board reflects opening moves
- `e2e-puzzles-smoke`: Smoke test that Puzzles route renders without crashing

### Modified Capabilities

## Impact

- `frontend/package.json`: add `@playwright/test` dev dep + `test:e2e` script
- `frontend/playwright.config.ts`: new file
- `frontend/e2e/`: new directory with 3 spec files
- No backend changes — all tested routes are backend-free (`/openings.json` is a static public asset)
