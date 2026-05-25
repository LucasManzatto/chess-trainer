## ADDED Requirements

### Requirement: Sync is triggered on demand and runs in the background
The system SHALL expose `POST /games/sync` for authenticated users. The endpoint SHALL return HTTP 202 immediately and run the sync as a background task. If a sync is already running for the user, the endpoint SHALL return HTTP 409.

#### Scenario: Sync triggered successfully
- **WHEN** an authenticated user with `chess_com_username` set calls `POST /games/sync` and no sync is running
- **THEN** the system returns HTTP 202 and starts background sync

#### Scenario: Sync rejected when already running
- **WHEN** an authenticated user calls `POST /games/sync` while `sync_status = "running"`
- **THEN** the system returns HTTP 409 with message "Sync already in progress"

#### Scenario: Sync rejected when no chess.com username set
- **WHEN** an authenticated user calls `POST /games/sync` with `chess_com_username = null`
- **THEN** the system returns HTTP 400 with message "chess.com username not set"

### Requirement: Initial sync fetches all-time game history
On first sync (no entries in `synced_months` for the user), the system SHALL fetch the chess.com archives list and process every month. Months SHALL be processed sequentially with at least 1 second between requests.

#### Scenario: All archive months fetched on initial sync
- **WHEN** a user with no synced months triggers sync
- **THEN** the system fetches all months from chess.com archives and upserts all games into the `games` table

#### Scenario: Rate limiting between month fetches
- **WHEN** the sync service processes consecutive archive months
- **THEN** there is at least a 1-second delay between chess.com API requests

### Requirement: Subsequent syncs only fetch the current month
If at least one entry exists in `synced_months` for the user, the system SHALL only fetch the current calendar month (to pick up new games since last sync). Already-synced months SHALL be skipped.

#### Scenario: Incremental sync skips old months
- **WHEN** a user with existing synced months triggers sync
- **THEN** the system only fetches the current calendar month from chess.com and skips all others

#### Scenario: Current month always re-fetched
- **WHEN** a user triggers sync and the current month was previously synced
- **THEN** the system re-fetches the current month to capture any games played since last sync

### Requirement: Sync progress is queryable via status endpoint
The system SHALL expose `GET /games/sync/status` returning `{ status, current_month, total_months, games_added, last_sync_at }` for the authenticated user.

#### Scenario: Status reflects running sync
- **WHEN** a sync is in progress and the user calls `GET /games/sync/status`
- **THEN** the response includes `status = "running"` and current progress counts

#### Scenario: Status reflects completed sync
- **WHEN** a sync has finished and the user calls `GET /games/sync/status`
- **THEN** the response includes `status = "done"` and `games_added` count

### Requirement: Games are deduplicated by chess.com game ID
The `games` table SHALL have a unique constraint on `(user_id, chess_com_id)`. The sync service SHALL use `INSERT ... ON CONFLICT DO NOTHING` so re-syncing a month never creates duplicate rows.

#### Scenario: Re-sync does not duplicate games
- **WHEN** a month is synced a second time with the same games
- **THEN** no duplicate rows are created in the `games` table
