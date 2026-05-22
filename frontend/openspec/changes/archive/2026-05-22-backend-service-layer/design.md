## Context

Backend is a FastAPI app serving the chess-trainer frontend. One router file (`api/v1/openings.py`, ~360 lines) contains Pydantic schemas, raw asyncpg SQL queries, and the SM-2 spaced repetition algorithm. Two placeholder directories (`models/`, `services/`) exist but are empty. The `models/` directory is not used in this refactor — no ORM is in use (raw asyncpg) so Pydantic response types serve as the model layer.

## Goals / Non-Goals

**Goals:**
- Zero changes to the external API contract (endpoints, status codes, response shapes identical)
- SM-2 logic isolated as a pure function callable without DB
- Service functions return Pydantic types (not raw asyncpg Records)
- All review findings from CLAUDE.md fixed in the same pass

**Non-Goals:**
- ORM / SQLAlchemy migration — raw asyncpg stays
- Repository pattern / abstract DB interface — premature abstraction for this scale
- Redis, caching, background workers — no performance issues yet
- Test suite — separate change; this makes the code testable, doesn't write tests

## Decisions

### 1. Service functions take `asyncpg.Connection`, not a repository object

Passing `conn` directly is pragmatic and matches the existing `Depends(get_conn)` pattern. A repository abstraction (abstract class with `get_comment(id)` etc.) would let us mock DB in tests but adds indirection not justified by the current scale.

**Alternative considered:** Repository pattern with an abstract interface. Rejected: premature abstraction. If the app grows to 5+ services sharing complex query patterns, revisit.

### 2. Service functions return Pydantic response models, not raw Records

```python
# service returns fully-typed value
async def create_opening_comment(...) -> OpeningCommentResponse:
    row = await conn.fetchrow(...)
    return OpeningCommentResponse(**dict(row))

# router just passes through
@router.post("/...", response_model=OpeningCommentResponse)
async def create_opening_comment_route(...) -> OpeningCommentResponse:
    return await comments.create_opening_comment(conn, user_id, opening_id, body.content)
```

Service owns the contract. Router has no knowledge of asyncpg Record shape.

**Alternative:** Services return Records, routers convert. Rejected: leaks asyncpg types into HTTP layer, duplication of `dict(row)` conversion across routes.

### 3. `compute_sm2` is a module-level pure function in `services/drill.py`

```python
def compute_sm2(
    ease_factor: float,
    interval_days: int,
    repetitions: int,
    grade: int,
) -> tuple[float, int, int]:  # new (ef, interval, reps)
    ...
```

Not a class, not a method. Pure function — same inputs, same outputs, no side effects. Lives in `drill.py` (not a separate `sm2.py`) because it's only called from one place. If puzzle drilling or other SRS features are added, extract then.

**Alternative:** Extract to `src/app/domain/sm2.py`. Rejected: one caller, no reuse yet — YAGNI.

### 4. Shared `httpx.AsyncClient` via lifespan + app state

```python
# main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient()
    await create_pool()
    yield
    await app.state.http_client.aclose()
    await close_pool()

# auth.py
async def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client

HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]
```

One client for the app lifetime, reuses TCP connections to Neon Auth.

**Alternative:** Module-level singleton client in `auth.py`. Works but harder to test (can't inject a mock client). `app.state` + `Depends` is the FastAPI-idiomatic pattern.

### 5. Required config fields — no empty-string defaults

```python
class Settings(BaseSettings):
    database_url: str        # required — ValidationError at startup if missing
    neon_auth_url: str       # required
    allowed_origins: str = "http://localhost:5173"  # optional, has safe default
```

`allowed_origins` keeps its default (safe for local dev). `database_url` and `neon_auth_url` have no default — missing env var raises `ValidationError` before the app accepts traffic.

The `if settings.database_url: await create_pool()` guard in `main.py` is removed — pool always created on startup.

### 6. Split `CommentUpdate` into `OpeningCommentUpdate` and `PositionCommentUpdate`

Currently one shared `CommentUpdate(content: str)` model. Split per operation so schemas can diverge independently without emergency surgery.

### 7. `ReviewRequest.grade` validated by Pydantic, not the router

```python
class ReviewRequest(BaseModel):
    grade: int = Field(ge=0, le=5)
```

FastAPI returns 422 automatically. OpenAPI docs reflect the constraint. The router-level `if not 0 <= body.grade <= 5: raise HTTPException(422, ...)` is deleted.

## Risks / Trade-offs

- `assert _pool is not None` → `RuntimeError`: behaviorally identical (both raise in `get_conn`), but `RuntimeError` is explicit and survives `python -O`. Low risk.
- Shared `httpx.AsyncClient` lives for the app's full lifetime — if Neon Auth rotates TLS certs or the connection goes stale, the client auto-reconnects (httpx handles this). No manual management needed.
- Removing `if settings.database_url:` guard means local dev without a `.env` file now fails at startup. This is intentional — silent skip was masking misconfiguration. `.env.example` documents required vars.

## Open Questions

- Pool size: asyncpg defaults to `min_size=10, max_size=10`. Neon free tier limits connections. Add `pool_min_size`/`pool_max_size` to Settings in this pass, or leave for when we hit the limit?
