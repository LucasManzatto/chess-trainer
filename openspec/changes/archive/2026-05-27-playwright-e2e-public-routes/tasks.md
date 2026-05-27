## 1. Install and Configure Playwright

- [x] 1.1 Install `@playwright/test` as a dev dependency in `frontend/package.json`
- [x] 1.2 Run `npx playwright install chromium` to install the browser binary
- [x] 1.3 Create `frontend/playwright.config.ts` with `baseURL: 'http://localhost:5173'`, `webServer` pointing to `npm run dev`, and `testDir: './e2e'`
- [x] 1.4 Add `test:e2e` script to `frontend/package.json` that runs `playwright test`
- [x] 1.5 Verify Vitest config excludes `e2e/` (check `vitest.config.ts` or `vite.config.ts` include patterns)

## 2. Verify Chessground Selectors

- [x] 2.1 Start the dev server and open `/` in Playwright's `page.pause()` inspector
- [x] 2.2 Confirm `cg-board [data-key="e2"]` selects the e2 square — if absent, identify the actual square attribute/class Chessground v10 emits and update the design doc

## 3. Free Play Spec

- [x] 3.1 Create `frontend/e2e/free-play.spec.ts`
- [x] 3.2 Write test: navigate to `/`, assert `cg-board` is visible
- [x] 3.3 Write test: assert at least one `piece.white.pawn` exists inside `cg-board`
- [x] 3.4 Write test: click e2 square, click e4 square, wait for move list to contain "e4"
- [x] 3.5 Run the spec and confirm all assertions pass

## 4. Openings Browse Spec

- [x] 4.1 Create `frontend/e2e/openings.spec.ts`
- [x] 4.2 Write test: navigate to `/openings`, wait up to 10s for at least one opening list item to appear
- [x] 4.3 Write test: type "Sicilian" in the search input, assert all visible items contain "Sicilian"
- [x] 4.4 Write test: type "xyzxyzxyz", assert no opening items visible
- [x] 4.5 Write test: search "Sicilian", click first result, wait for move list to contain at least one move entry
- [x] 4.6 Run the spec and confirm all assertions pass

## 5. Puzzles Smoke Spec

- [x] 5.1 Create `frontend/e2e/puzzles.spec.ts`
- [x] 5.2 Write test: navigate to `/puzzles`, assert heading "Puzzles" is visible
- [x] 5.3 Write test: assert no error boundary fallback text is visible (e.g., "Something went wrong")
- [x] 5.4 Run the spec and confirm all assertions pass

## 6. Final Verification

- [x] 6.1 Run full suite `npm run test:e2e` from `frontend/` — all tests green
- [x] 6.2 Run `npm run test` (Vitest) and confirm E2E specs are not included
