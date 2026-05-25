## ADDED Requirements

### Requirement: Games list endpoint returns paginated synced games
The system SHALL expose `GET /games` for authenticated users, returning the user's synced games ordered by `played_at` descending. The endpoint SHALL support query parameters: `result` (`win|loss|draw`), `color` (`white|black`), `time_class` (`bullet|blitz|rapid|daily`), `eco` (prefix match, e.g. `"B"`), `limit` (default 50, max 200), `offset` (default 0).

#### Scenario: Returns games for authenticated user
- **WHEN** an authenticated user calls `GET /games` with no filters
- **THEN** the system returns the user's games ordered by `played_at` descending with total count

#### Scenario: Filter by result
- **WHEN** an authenticated user calls `GET /games?result=win`
- **THEN** only games with `result = "win"` are returned

#### Scenario: Filter by color
- **WHEN** an authenticated user calls `GET /games?color=black`
- **THEN** only games where the user played as black are returned

#### Scenario: Filter by time class
- **WHEN** an authenticated user calls `GET /games?time_class=blitz`
- **THEN** only blitz games are returned

#### Scenario: Filter by ECO prefix
- **WHEN** an authenticated user calls `GET /games?eco=B`
- **THEN** only games with ECO codes starting with "B" are returned

#### Scenario: Empty list when no games synced
- **WHEN** an authenticated user with no synced games calls `GET /games`
- **THEN** the system returns an empty list and total count of 0

### Requirement: Each game in the list includes display fields
Each game object in the response SHALL include: `id`, `chess_com_id`, `white_username`, `white_rating`, `black_username`, `black_rating`, `user_color`, `result`, `termination`, `time_class`, `time_control`, `eco`, `opening_name`, `played_at`, `moves` (full SAN array for board replay), and `analysis` (nullable — the stored `GameAnalysis` object if analysis has been run, otherwise `null`).

#### Scenario: Game object contains all required fields
- **WHEN** an authenticated user calls `GET /games` and games exist
- **THEN** each game object in the response contains all fields including `moves` array, `user_color`, and `analysis` (null if not yet analyzed)

## ADDED Requirements

### Requirement: Game rows display accuracy badges when analysis exists
When a game in the list has a stored `analysis`, its row SHALL display the white and black accuracy percentages (e.g. "87% / 82%"). Rows without analysis SHALL show no badge.

#### Scenario: Accuracy badges shown for analyzed game
- **WHEN** a game row has `analysis` data with `white_accuracy` and `black_accuracy`
- **THEN** both percentages are displayed in the game row

#### Scenario: No badge for unanalyzed game
- **WHEN** a game row has `analysis: null`
- **THEN** no accuracy badge is shown in that row
