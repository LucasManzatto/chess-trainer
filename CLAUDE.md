# Chess Trainer — Claude Guidelines

## React Philosophies

Condensed principles to apply when writing React code in this project.

### 1. The Bare Minimum

- Enable `eslint-plugin-react-hooks` rules: `rules-of-hooks` + `exhaustive-deps`. Fix all warnings.
- Be honest about `useEffect`/`useMemo`/`useCallback` dependencies — don't lie to the linter.
- Always add `key` props in `.map()` renders.
- Only call hooks at the top level — never inside loops, conditions, or nested functions.
- Add error boundaries at multiple levels to prevent white-screen crashes.
- YAGNI: don't add dependencies or abstractions until they're actually needed.
- Leave code better than you found it: add `TODO`/`FIXME` comments when you spot a smell you can't fix immediately.

### 2. Design for Happiness

- **No redundant state.** Derive values from existing state during render instead of syncing with effects.
  ```tsx
  // Bad: three useState + useEffect chain to compute area/perimeter
  // Good: const area = computeArea(a, b) directly in render
  ```
- **Pass primitives as props**, not whole objects. Components should only know what they need.
  ```tsx
  // Bad: <Summary member={member} />
  // Good: <Summary imgUrl={...} webUrl={...} header={...} />
  ```
- **Single responsibility.** If you need "and" or "or" to describe a component, split it.
- **No premature abstraction.** Duplication is cheaper than the wrong abstraction. Wait until the pattern is clear.
- Avoid prop drilling with composition, not just Context. Context is not the default solution for state sharing.
- Split large `useEffect`s into smaller independent ones.
- Extract logic into custom hooks and helper functions.
- Prefer primitives as `useCallback`/`useMemo`/`useEffect` dependencies — fewer deps, fewer surprises.
- Use `useReducer` when multiple state values depend on each other.
- Place Context as low in the tree as possible, not globally unless necessary.

### 3. Performance

- Prove slowness with the React DevTools profiler before optimizing.
- `useMemo` only for genuinely expensive calculations. `useCallback` only when the reference stability matters downstream.
- `React.memo`/`useMemo`/`useCallback` with many or object dependencies often don't help — verify empirically.
- Fix slow renders before fixing re-renders.
- Colocate state close to where it's used — simpler code AND faster app.
- Logically split Contexts: one Context changing rerenders all consumers, even those not using that value.
- Lazy-load routes and heavy components; window large lists.

### 4. Testing

- Tests should resemble how users actually use the software.
- Don't test implementation details — test behavior.
- Aim for ~70% coverage on the frontend; beyond that, diminishing returns.
- Rarely need to change tests when refactoring = tests are correct.
- Prefer integration tests over unit tests for UI.

## FastAPI & Python Philosophies

Condensed principles to apply when writing backend code in this project.

### 1. The Bare Minimum

- **Strict Typing & Linters.** Enable `ruff` (lint + format) and `mypy` (strict). Fix all type warnings — never use `Any` to bypass the type checker.
- **Pydantic for Data Integrity.** Every request body and response model must use explicit `BaseModel`. Never parse raw JSON dicts directly from the request.
- **Mind the Async/Sync Divide.** Use `async def` only for I/O-bound ops with async drivers (`asyncpg`, `httpx`). Use `def` for CPU-bound tasks or sync libraries — avoids blocking the event loop.
- **Environment Isolation.** Never hardcode secrets. Use Pydantic `BaseSettings` — validated on startup.
- **Fail Fast & Explicitly.** Catch specific exceptions at the boundary; raise semantic `HTTPException` with accurate status codes.
- Leave code better: add `TODO`/`FIXME` with a reason when you spot debt you can’t fix immediately.

### 2. Design for Happiness

- **Fat Models, Skinny Routers.** Router files handle HTTP only (routing, status codes, DI). Business logic lives in service layers or domain models.
  ```python
  # Bad: 30 lines of logic in the router
  @router.post("/games")
  async def create_game(data: GameCreate, db: Session = Depends(get_db)):
      ...

  # Good: router delegates to service
  @router.post("/games", response_model=GameResponse)
  async def create_game(data: GameCreate, svc: GameService = Depends()):
      return await svc.create(data)
  ```
- **Leverage `Depends`.** Use DI for DB sessions, auth, and external clients — modular and easy to mock.
- **Explicit Response Models.** Always declare `response_model=` or a return type annotation — prevents data leaks, generates accurate OpenAPI docs.
- **No Premature Abstraction.** Write straightforward queries first. No generic CRUD wrappers until logic is actually duplicated across services.
- **Database Session Lifespans.** Use `Depends` or context managers — session always closes, even on error.
- **Granular Schemas.** Never reuse one model for create, update, and response.
  ```python
  # Bad: one model, fields nullable to handle every case
  class User(BaseModel):
      id: int | None = None
      password: str | None = None

  # Good: distinct schema per operation
  class UserCreate(BaseModel): ...
  class UserUpdate(BaseModel): ...
  class UserResponse(BaseModel): ...
  ```

### 3. Performance & Concurrency

- **Database Optimization.** Use `selectinload` / `joinedload` in SQLAlchemy to kill N+1 queries before they slow chess analytics or game history lookups.
- **Offload Heavy Lifting.** Engine evaluations, bulk PGN parsing, and analytics are CPU-bound — never run in a request thread. Use `BackgroundTasks` for quick jobs or Celery/Dramatiq for long-running ones.
- **Connection Pooling.** Configure DB and Redis pools for concurrency; initialize once via FastAPI’s `lifespan` context manager.
- **Profile Before You Optimize.** Use `cProfile` or APM middleware to prove a bottleneck exists before restructuring queries or adding caching.

### 4. Testing

- **DB Isolation per Test.** Every test runs in a transaction that rolls back at the end — no state leaks between tests.
- **Test via `TestClient` / `AsyncClient`.** Hit endpoints directly — validates the HTTP layer, DI, and business logic all together.
- **Mock External APIs, Not Your DB.** Mock external chess APIs; test against a real lightweight PostgreSQL instance (Docker).
- Aim for ~80% coverage on business logic, chess rule edge cases, and auth flows. If a refactor breaks logic but tests pass, you’re testing implementation details.