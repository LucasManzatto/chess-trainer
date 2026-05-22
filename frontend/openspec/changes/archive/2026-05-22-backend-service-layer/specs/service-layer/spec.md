## ADDED Requirements

### Requirement: Schemas module separates data contracts from routing
All Pydantic request/response models SHALL live in `src/app/schemas/openings.py`, not in router files. Router files SHALL NOT define any `BaseModel` subclasses.

#### Scenario: Schema import path
- **WHEN** a router or service needs a Pydantic model
- **THEN** it imports from `src.app.schemas.openings`, not from the router module

### Requirement: Comment service owns all comment SQL
`src/app/services/comments.py` SHALL implement eight functions covering opening comment and position comment CRUD. Each function SHALL accept an `asyncpg.Connection`, the authenticated `user_id`, and operation-specific parameters. Each function SHALL return a Pydantic response model or `None` for deletes.

#### Scenario: Create opening comment
- **WHEN** `create_opening_comment(conn, user_id, opening_id, content)` is called
- **THEN** it inserts a row and returns `OpeningCommentResponse`

#### Scenario: Update with wrong user
- **WHEN** `update_opening_comment(conn, user_id, comment_id, content)` is called and the comment belongs to a different user
- **THEN** it raises `HTTPException(404)`

#### Scenario: Delete returns none
- **WHEN** `delete_opening_comment(conn, user_id, comment_id)` is called and the row exists
- **THEN** it returns `None` with no error

#### Scenario: Delete not found
- **WHEN** `delete_opening_comment(conn, user_id, comment_id)` is called and no matching row exists
- **THEN** it raises `HTTPException(404)`

### Requirement: Drill service owns drill queue and add-to-drill SQL
`src/app/services/drill.py` SHALL implement `get_queue` and `add_to_drill`. Both functions SHALL accept `asyncpg.Connection` and `user_id`. `get_queue` SHALL return `list[DrillQueueItem]`. `add_to_drill` SHALL upsert and return `DrillAddResponse`.

#### Scenario: Queue returns only due items
- **WHEN** `get_queue(conn, user_id)` is called
- **THEN** only openings with `due_date <= CURRENT_DATE` are returned, ordered by `due_date ASC`

#### Scenario: Add to drill idempotent
- **WHEN** `add_to_drill(conn, user_id, opening_id)` is called for an opening already in the queue
- **THEN** it returns `DrillAddResponse` without raising an error

### Requirement: SM-2 algorithm is a pure function
`compute_sm2(ease_factor, interval_days, repetitions, grade)` SHALL be a module-level function in `services/drill.py` with no I/O, no DB access, and no side effects. It SHALL return a tuple `(new_ease_factor, new_interval_days, new_repetitions)`.

#### Scenario: Grade below 3 resets progress
- **WHEN** `compute_sm2` is called with `grade < 3`
- **THEN** `repetitions` resets to `0` and `interval_days` resets to `1`

#### Scenario: Ease factor floor at 1.3
- **WHEN** `compute_sm2` is called with a low grade that would reduce `ease_factor` below `1.3`
- **THEN** returned `ease_factor` is exactly `1.3`

#### Scenario: Rep sequence 0 → 1 → 6 → scaled
- **WHEN** `compute_sm2` is called with `grade >= 3` and `repetitions == 0`
- **THEN** `interval_days` is `1`
- **WHEN** called again with `repetitions == 1`
- **THEN** `interval_days` is `6`
- **WHEN** called again with `repetitions >= 2`
- **THEN** `interval_days` equals `round(prev_interval * ease_factor)`

### Requirement: Review service delegates to compute_sm2 then persists
`review(conn, user_id, opening_id, grade)` in `services/drill.py` SHALL fetch current SM-2 state from DB, call `compute_sm2`, persist the result, and return `DrillAddResponse`.

#### Scenario: Opening not in queue
- **WHEN** `review(conn, user_id, opening_id, grade)` is called for an opening not in `opening_progress`
- **THEN** it raises `HTTPException(404)`

### Requirement: Router is HTTP-only
`api/v1/openings.py` SHALL contain only route declarations, `Depends` wiring, and `status_code` / `response_model` declarations. It SHALL NOT contain SQL queries, SM-2 logic, or `BaseModel` definitions.

#### Scenario: Route function body length
- **WHEN** any route handler function is read
- **THEN** its body is a single `return await service_fn(...)` call (plus any parameter unpacking)
