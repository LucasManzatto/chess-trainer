## ADDED Requirements

### Requirement: Initialize Stockfish engine
The system SHALL load a Stockfish WASM instance inside a Web Worker when the evaluation hook mounts. The engine SHALL be initialized with the UCI protocol (`uci` command) before any position is evaluated. The Worker SHALL be terminated when the hook unmounts to free resources.

#### Scenario: Engine initializes on mount
- **WHEN** `usePositionEvaluation` mounts
- **THEN** a Stockfish Web Worker is created and the UCI handshake completes before any evaluation is requested

#### Scenario: Engine terminates on unmount
- **WHEN** the component using `usePositionEvaluation` unmounts
- **THEN** the Web Worker is terminated and no further engine messages are processed

### Requirement: Evaluate a FEN position
The system SHALL accept a FEN string and return an evaluation result containing a score type (`'cp'` for centipawns or `'mate'` for forced mate) and a numeric value. The evaluation SHALL run at depth 18. The result SHALL always reflect the perspective of the side to move: positive = current side is winning, negative = current side is losing.

#### Scenario: Centipawn evaluation returned
- **WHEN** `usePositionEvaluation` receives a FEN for a non-terminal position
- **THEN** it returns `{ type: 'cp', value: <number> }` where value is in centipawns from the perspective of the side to move

#### Scenario: Evaluation updates on FEN change
- **WHEN** the FEN prop changes to a new position
- **THEN** the hook cancels any in-progress search and starts a new evaluation for the updated FEN

#### Scenario: Loading state during search
- **WHEN** a new FEN is received and the engine is searching
- **THEN** the hook returns `isLoading: true` until the search completes at the target depth

### Requirement: Handle forced mate scores
When Stockfish detects a forced mate, the system SHALL return a mate score instead of a centipawn score. Positive mate value means the side to move has a forced mate; negative means the side to move is being mated.

#### Scenario: Mate-in-N score returned
- **WHEN** Stockfish reports `score mate 3` for the current position
- **THEN** hook returns `{ type: 'mate', value: 3 }`

#### Scenario: Being-mated score returned
- **WHEN** Stockfish reports `score mate -2` for the current position
- **THEN** hook returns `{ type: 'mate', value: -2 }`

### Requirement: Cancel superseded evaluations
If a new FEN arrives while the engine is still searching the previous position, the system SHALL send a `stop` command to the engine and discard any partial results from the superseded search before starting the new one.

#### Scenario: Rapid FEN changes do not produce stale results
- **WHEN** the user navigates through three moves in quick succession
- **THEN** only the evaluation for the final FEN is reflected in the returned score; intermediate scores are discarded

### Requirement: Handle evaluation errors gracefully
If the engine fails to initialize or returns an unexpected response, the system SHALL return an error state without crashing the UI.

#### Scenario: Engine error does not crash the app
- **WHEN** the Stockfish Worker fails to load (e.g. WASM not supported)
- **THEN** `usePositionEvaluation` returns `{ error: true }` and the UI renders without the evaluation bar
