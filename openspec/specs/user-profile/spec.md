## ADDED Requirements

### Requirement: User profile stores chess.com username
The system SHALL maintain a `user_profiles` table with one row per authenticated user. The profile SHALL store `chess_com_username` (nullable until set), `sync_status` (`idle | running | done | error`), `sync_progress` (JSON with `current_month`, `total_months`, `games_added`), and `last_sync_at` (nullable datetime).

#### Scenario: Profile auto-created on first access
- **WHEN** an authenticated user calls `GET /users/profile` and no profile row exists
- **THEN** the system creates a profile with `chess_com_username = null` and `sync_status = "idle"` and returns it

#### Scenario: Retrieve existing profile
- **WHEN** an authenticated user calls `GET /users/profile` and a profile row exists
- **THEN** the system returns the existing profile including `chess_com_username` and `sync_status`

### Requirement: User can set chess.com username
The system SHALL allow an authenticated user to set or update their `chess_com_username` via `PATCH /users/profile`.

#### Scenario: Set username for the first time
- **WHEN** an authenticated user calls `PATCH /users/profile` with `{"chess_com_username": "lucasmanzatto"}`
- **THEN** the profile is updated and the response returns the updated profile with the new username

#### Scenario: Update existing username
- **WHEN** an authenticated user calls `PATCH /users/profile` with a different username
- **THEN** the profile is updated and the old username is overwritten

#### Scenario: Username is validated as non-empty string
- **WHEN** an authenticated user calls `PATCH /users/profile` with `{"chess_com_username": ""}`
- **THEN** the system returns HTTP 422 with a validation error
