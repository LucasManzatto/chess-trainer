## Why

The FastAPI backend has schemas, SQL queries, and business logic (SM-2 algorithm) all in a single router file (`api/v1/openings.py`). This violates the Fat Models, Skinny Routers principle and makes the SM-2 algorithm untestable without mocking the DB. Several additional issues found in review also need fixing: per-request `httpx.AsyncClient` creation, empty-string config defaults that cause silent startup failures, and an `assert` that disappears with `python -O`.

## What Changes

- Extract all Pydantic schemas to `src/app/schemas/openings.py`
- Create `src/app/services/comments.py` — opening and position comment CRUD
- Create `src/app/services/drill.py` — drill queue, add-to-drill, SM-2 review with `compute_sm2()` extracted as a pure testable function
- Thin router: `api/v1/openings.py` becomes HTTP-only (routing, status codes, DI)
- Fix `config.py`: remove empty-string defaults on required fields so missing env vars fail at startup
- Fix `db.py`: replace `assert _pool is not None` with explicit `RuntimeError`
- Fix `auth.py`: shared `httpx.AsyncClient` via lifespan dependency instead of per-request creation
- Fix `schemas`: `CommentUpdate` split into `OpeningCommentUpdate` and `PositionCommentUpdate`; `ReviewRequest.grade` validated via `Field(ge=0, le=5)` instead of router-level `if` check
- Add `pyproject.toml` with ruff + mypy strict configuration

## Capabilities

### New Capabilities
- `service-layer`: Service modules (`comments.py`, `drill.py`) that own SQL queries and business logic; pure `compute_sm2()` function; schemas module separating data contracts from routing
- `linter-config`: ruff + mypy strict configuration enforced via `pyproject.toml`

### Modified Capabilities

## Impact

- `src/app/api/v1/openings.py` — rewritten, delegates all logic to services
- `src/app/schemas/openings.py` — new file
- `src/app/services/comments.py` — new file
- `src/app/services/drill.py` — new file
- `src/app/config.py` — required fields, no empty defaults
- `src/app/db.py` — explicit RuntimeError guard
- `src/app/auth.py` — shared httpx client
- `src/app/main.py` — lifespan manages httpx client lifecycle
- `pyproject.toml` — new file at backend root
- No API contract changes — all endpoints, status codes, and response shapes stay identical
