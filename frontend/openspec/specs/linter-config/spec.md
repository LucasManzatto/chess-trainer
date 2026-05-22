## ADDED Requirements

### Requirement: pyproject.toml configures ruff and mypy
`backend/pyproject.toml` SHALL exist and configure ruff (lint + format) and mypy (strict mode) for the `src/` directory.

#### Scenario: ruff config present
- **WHEN** `pyproject.toml` is read
- **THEN** it contains a `[tool.ruff]` section targeting Python 3.11+ with standard lint rules enabled

#### Scenario: mypy strict mode
- **WHEN** `pyproject.toml` is read
- **THEN** it contains `[tool.mypy]` with `strict = true` and `python_version = "3.11"`

### Requirement: Config fields are required — no silent startup failures
`database_url` and `neon_auth_url` in `Settings` SHALL have no default value. Missing env vars SHALL raise `ValidationError` at import time, preventing startup.

#### Scenario: Missing DATABASE_URL
- **WHEN** the app starts without `DATABASE_URL` set
- **THEN** Pydantic raises `ValidationError` before any request is accepted

### Requirement: DB pool guard uses RuntimeError, not assert
`get_conn()` in `db.py` SHALL use an explicit `if _pool is None: raise RuntimeError(...)` guard instead of `assert`.

#### Scenario: Guard survives python -O
- **WHEN** Python runs with `-O` (optimize) flag
- **THEN** the pool guard still raises `RuntimeError` if pool is not initialised

### Requirement: Shared httpx.AsyncClient via lifespan
`auth.py` SHALL NOT create a new `httpx.AsyncClient` per request. The client SHALL be created once in the `lifespan` context manager and injected via `Depends`.

#### Scenario: Single client per app lifetime
- **WHEN** 100 concurrent requests authenticate
- **THEN** all use the same `AsyncClient` instance (verified via `id(client)` in tests)

### Requirement: Grade validated by Pydantic Field constraint
`ReviewRequest.grade` SHALL use `Field(ge=0, le=5)`. The router SHALL NOT contain a manual `if not 0 <= grade <= 5` guard.

#### Scenario: Grade out of range returns 422
- **WHEN** a POST to `/{opening_id}/review` sends `{"grade": 6}`
- **THEN** FastAPI returns HTTP 422 with validation error detail

### Requirement: Separate update schemas per comment type
`OpeningCommentUpdate` and `PositionCommentUpdate` SHALL be distinct `BaseModel` subclasses. The shared `CommentUpdate` class SHALL be deleted.

#### Scenario: Independent evolution
- **WHEN** `PositionCommentUpdate` gains a new field
- **THEN** `OpeningCommentUpdate` is unaffected
