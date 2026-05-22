## 1. Infrastructure fixes

- [x] 1.1 `config.py`: remove empty-string defaults from `database_url` and `neon_auth_url` so missing env vars raise `ValidationError` at startup
- [x] 1.2 `db.py`: replace `assert _pool is not None` with `if _pool is None: raise RuntimeError("DB pool not initialised")`
- [x] 1.3 `main.py`: create `httpx.AsyncClient` in lifespan, store on `app.state.http_client`, close in teardown; remove `if settings.database_url:` guard (pool always created)
- [x] 1.4 `auth.py`: add `get_http_client(request: Request) -> httpx.AsyncClient` dependency that reads `request.app.state.http_client`; update `get_current_user_id` to accept `HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]` instead of creating a new client
- [x] 1.5 `pyproject.toml`: create at `backend/pyproject.toml` with `[tool.ruff]` (Python 3.11, standard rules) and `[tool.mypy]` (strict = true, python_version = "3.11")

## 2. Schemas module

- [x] 2.1 Create `src/app/schemas/__init__.py`
- [x] 2.2 Create `src/app/schemas/openings.py` with all models: `OpeningCommentCreate`, `OpeningCommentResponse`, `OpeningCommentUpdate`, `PositionCommentCreate`, `PositionCommentResponse`, `PositionCommentUpdate`, `DrillQueueItem`, `ReviewRequest` (with `Field(ge=0, le=5)`), `DrillAddResponse`

## 3. Comments service

- [x] 3.1 Create `src/app/services/comments.py` with eight async functions:
  - `list_opening_comments(conn, user_id, opening_id) -> list[OpeningCommentResponse]`
  - `create_opening_comment(conn, user_id, opening_id, content) -> OpeningCommentResponse`
  - `update_opening_comment(conn, user_id, comment_id, content) -> OpeningCommentResponse` (raises 404 if not found)
  - `delete_opening_comment(conn, user_id, comment_id) -> None` (raises 404 if not found)
  - `list_position_comments(conn, user_id, opening_id) -> list[PositionCommentResponse]`
  - `create_position_comment(conn, user_id, opening_id, move_index, fen, content) -> PositionCommentResponse`
  - `update_position_comment(conn, user_id, comment_id, content) -> PositionCommentResponse` (raises 404 if not found)
  - `delete_position_comment(conn, user_id, comment_id) -> None` (raises 404 if not found)

## 4. Drill service

- [x] 4.1 Create `src/app/services/drill.py` with pure function `compute_sm2(ease_factor, interval_days, repetitions, grade) -> tuple[float, int, int]` containing the SM-2 algorithm (extracted from the router)
- [x] 4.2 Add `get_queue(conn, user_id) -> list[DrillQueueItem]` to `drill.py`
- [x] 4.3 Add `add_to_drill(conn, user_id, opening_id) -> DrillAddResponse` to `drill.py`
- [x] 4.4 Add `review(conn, user_id, opening_id, grade) -> DrillAddResponse` to `drill.py` — fetches SM-2 state, calls `compute_sm2`, persists result

## 5. Thin router

- [x] 5.1 Rewrite `api/v1/openings.py`: import schemas from `schemas.openings`, import service functions from `services.comments` and `services.drill`; each route handler body is a single `return await service_fn(...)` call; delete all inline SQL, SM-2 logic, and `BaseModel` definitions

## 6. Verification

- [x] 6.1 Run `cd backend && python -m ruff check src/` — zero errors
- [x] 6.2 Run `cd backend && python -m mypy src/` — zero errors
- [x] 6.3 Run backend locally, hit all 13 endpoints via curl or the frontend — all responses match previous behaviour
