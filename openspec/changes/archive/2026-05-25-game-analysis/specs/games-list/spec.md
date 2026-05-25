## MODIFIED Requirements

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
