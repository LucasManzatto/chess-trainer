## ADDED Requirements

### Requirement: User can trigger full game analysis
The system SHALL provide an "Analyze" button in the Games tab when a game is selected. Clicking it SHALL start sequential Stockfish WASM analysis of all positions in the game. When analysis already exists for the selected game, the button SHALL read "Re-analyze" and allow overwriting. The button SHALL be disabled while analysis is running.

#### Scenario: Analyze button appears when game is selected
- **WHEN** a user selects a game in the Games tab
- **THEN** an "Analyze" button is visible in the board area

#### Scenario: Analysis starts on click
- **WHEN** the user clicks "Analyze"
- **THEN** the button becomes disabled, a progress indicator appears, and analysis begins

#### Scenario: Re-analyze button when analysis exists
- **WHEN** the selected game already has stored analysis
- **THEN** the button reads "Re-analyze" and clicking it overwrites the existing analysis

### Requirement: Analysis progress is shown
The system SHALL display a progress indicator during analysis showing the number of positions evaluated out of total (e.g. "14 / 61").

#### Scenario: Progress updates during analysis
- **WHEN** analysis is running
- **THEN** the progress counter increments after each position is evaluated

#### Scenario: Progress disappears on completion
- **WHEN** analysis finishes
- **THEN** the progress indicator is no longer shown

### Requirement: Each move is classified by quality
For each move in an analyzed game, the system SHALL compute a `cp_loss` (centipawn loss) and assign one of the following classifications:

| cp_loss | Classification |
|---------|---------------|
| 0 AND played move == engine best move | best |
| 1–10 | excellent |
| 11–25 | good |
| 26–50 | inaccuracy |
| 51–100 | mistake |
| 101+ | blunder |

`cp_loss` is computed from sequential position evaluations: `white_cp_loss[i] = max(0, score[i] − score[i+1])`, `black_cp_loss[i] = max(0, score[i+1] − score[i])`, where all scores are normalized to white's perspective.

#### Scenario: Best move classification
- **WHEN** the played move matches the engine's best move and cp_loss is 0
- **THEN** the move is classified as "best"

#### Scenario: Blunder classification
- **WHEN** cp_loss exceeds 100
- **THEN** the move is classified as "blunder"

#### Scenario: Inaccuracy classification
- **WHEN** cp_loss is between 26 and 50
- **THEN** the move is classified as "inaccuracy"

### Requirement: Per-player accuracy is computed
The system SHALL compute a `white_accuracy` and `black_accuracy` percentage using the lichess formula: `accuracy = clamp(103.1668 × exp(−0.04354 × avg_cp_loss) − 3.1669, 0, 100)`, applied separately to white's moves and black's moves.

#### Scenario: Perfect game accuracy
- **WHEN** all moves have cp_loss of 0
- **THEN** accuracy approaches 100%

#### Scenario: Game with blunders
- **WHEN** a player has several moves with high cp_loss
- **THEN** their accuracy is noticeably below 100%

### Requirement: Analysis is persisted to the backend
After analysis completes, the system SHALL POST the result to `PUT /api/v1/games/{id}/analysis`. The backend SHALL store the analysis as JSONB on the Game record. Subsequent fetches of the game SHALL include the analysis in the response.

#### Scenario: Analysis saved after completion
- **WHEN** analysis finishes in the browser
- **THEN** the result is sent to the backend and stored

#### Scenario: Analysis included in game response
- **WHEN** a game with stored analysis is fetched via `GET /games`
- **THEN** the response includes the `analysis` field with moves, accuracies, depth, and timestamp

#### Scenario: Re-analysis overwrites existing
- **WHEN** the user triggers analysis on a game that already has analysis
- **THEN** the new analysis replaces the old one

### Requirement: Move list shows move classification colors
The MoveList component SHALL accept an optional `moveClassifications` prop (`MoveClassification[]`). When provided, each move token SHALL be colored by classification: green for best/excellent, yellow for good/inaccuracy, red for mistake/blunder.

#### Scenario: Colored moves when classifications provided
- **WHEN** `moveClassifications` is passed with the same length as `moves`
- **THEN** each move token is colored according to its classification

#### Scenario: No color change without classifications
- **WHEN** `moveClassifications` is not provided
- **THEN** move tokens render with their default styling (no classification colors)

### Requirement: Games list shows accuracy badges
When a game in the GamesList has stored analysis, its row SHALL display accuracy badges showing white and black accuracy percentages (e.g. "87% / 82%").

#### Scenario: Accuracy shown for analyzed game
- **WHEN** a game row has analysis data with white_accuracy and black_accuracy
- **THEN** both percentages are displayed in the row

#### Scenario: No badge for unanalyzed game
- **WHEN** a game row has no analysis data
- **THEN** no accuracy badge is shown
