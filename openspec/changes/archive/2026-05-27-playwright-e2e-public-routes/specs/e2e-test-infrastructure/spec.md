## ADDED Requirements

### Requirement: Playwright is installed and configured
The project SHALL have `@playwright/test` as a dev dependency in `frontend/package.json` with a `playwright.config.ts` at the `frontend/` root that targets the Vite dev server.

#### Scenario: Running the E2E suite starts the dev server automatically
- **WHEN** `npm run test:e2e` is executed from `frontend/`
- **THEN** Playwright starts the Vite dev server on port 5173 if not already running, executes all specs in `e2e/`, and exits with code 0 on success

#### Scenario: Reusing an already-running dev server locally
- **WHEN** port 5173 is already in use and `CI` env var is not set
- **THEN** Playwright reuses the existing server instead of starting a new one

#### Scenario: Test output is human-readable
- **WHEN** the test suite completes
- **THEN** Playwright prints a pass/fail summary per test with test names visible in the terminal

### Requirement: E2E tests are isolated from unit tests
The `npm run test` script (Vitest) SHALL NOT run files in `e2e/`. The `npm run test:e2e` script (Playwright) SHALL NOT run Vitest unit tests.

#### Scenario: Unit test run excludes E2E specs
- **WHEN** `npm run test` is executed
- **THEN** no files from `frontend/e2e/` are included in the Vitest run

#### Scenario: E2E run excludes unit tests
- **WHEN** `npm run test:e2e` is executed
- **THEN** no files from `frontend/src/` are included in the Playwright run
