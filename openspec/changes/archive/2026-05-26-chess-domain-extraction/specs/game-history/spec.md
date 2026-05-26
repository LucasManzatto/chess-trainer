## MODIFIED Requirements

### Requirement: Hook exposes move history state
`useChessGame()` SHALL maintain a list of played moves and expose it to consumers via `allMoves: string[]` and `currentMoveIndex: number`.

#### Scenario: Initial state is empty
- **WHEN** `useChessGame()` is first called
- **THEN** `allMoves` is an empty array and `currentMoveIndex` is `-1`

#### Scenario: Move is recorded
- **WHEN** a legal move is made on the board
- **THEN** `allMoves` grows by one entry and `currentMoveIndex` advances

### Requirement: Hook manages history navigation
`useChessGame()` SHALL expose navigation functions (`navigateBack`, `navigateForward`, `navigateToIndex`) and reflect the currently-viewed position via `boardFen`.

#### Scenario: Viewing a past position
- **WHEN** `navigateToIndex(i)` is called with a valid index
- **THEN** `boardFen` returns the FEN at that index and the board is non-interactive

#### Scenario: Viewing the live position
- **WHEN** `navigateToIndex(null)` is called
- **THEN** `boardFen` returns the FEN of the last move and the board is interactive (when `interactiveAtEnd` is true)

#### Scenario: Click navigates to move
- **WHEN** `handleMoveClick(index)` is called with a valid index
- **THEN** `currentMoveIndex` is set to that index

### Requirement: Hook can load a full game from PGN text
`useChessGame()` SHALL expose `loadFromPgn(pgn: string)`. On success it SHALL replace `allMoves` with the parsed move list, set `currentMoveIndex` to the last move index, set `gameMetadata` to the parsed PGN headers, and return `{ ok: true }`. On failure it SHALL leave existing state unchanged and return `{ ok: false; error: string }`.

#### Scenario: Valid PGN replaces game state
- **WHEN** `loadFromPgn` is called with valid PGN text
- **THEN** `allMoves` contains the parsed moves, `currentMoveIndex` is `allMoves.length - 1`, and `gameMetadata` contains header values

#### Scenario: Invalid PGN returns error, state unchanged
- **WHEN** `loadFromPgn` is called with invalid PGN text
- **THEN** returns `{ ok: false, error: <message> }` and `allMoves` / `currentMoveIndex` are unchanged

#### Scenario: Empty string is invalid
- **WHEN** `loadFromPgn` is called with an empty string
- **THEN** returns `{ ok: false, error: <message> }`

### Requirement: Hook exposes game metadata
`useChessGame()` SHALL expose `gameMetadata: GameMetadata | null`. It SHALL be `null` on init and populated after a successful `loadFromPgn` call.

#### Scenario: gameMetadata is null on init
- **WHEN** `useChessGame()` is first called
- **THEN** `gameMetadata` is `null`

#### Scenario: gameMetadata populated after import
- **WHEN** `loadFromPgn` succeeds
- **THEN** `gameMetadata` reflects White, Black, Event, Date headers from the PGN (absent headers are undefined)

### Requirement: Hook handles keyboard navigation
`useChessGame()` SHALL register keyboard listeners for ←, →, and Esc and update `currentMoveIndex` accordingly.

#### Scenario: Left arrow steps backward
- **WHEN** `ArrowLeft` is pressed and `currentMoveIndex` is greater than 0
- **THEN** `currentMoveIndex` decrements by 1

#### Scenario: Right arrow steps forward
- **WHEN** `ArrowRight` is pressed and `currentMoveIndex` is not at the last move
- **THEN** `currentMoveIndex` increments by 1

#### Scenario: Escape returns to last move
- **WHEN** `Escape` is pressed
- **THEN** `currentMoveIndex` is set to `allMoves.length - 1`

#### Scenario: No moves, keys are no-ops
- **WHEN** any navigation key is pressed and `allMoves` is empty
- **THEN** `currentMoveIndex` remains `-1`
