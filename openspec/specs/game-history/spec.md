# Game History Spec

### Requirement: Hook exposes move history state
`useGameHistory()` SHALL maintain a list of played moves and expose it to consumers.

#### Scenario: Initial state is empty
- **WHEN** `useGameHistory()` is first called
- **THEN** `moves` is an empty array and `viewIndex` is `null`

#### Scenario: Move is recorded
- **WHEN** `handleMove(moveResult)` is called
- **THEN** `moves` grows by one entry containing the move result

### Requirement: Hook manages history navigation
`useGameHistory()` SHALL track which position in history is being viewed (`viewIndex`) and expose derived board props.

#### Scenario: Viewing a past position
- **WHEN** `viewIndex` is set to a valid index
- **THEN** `position` returns the FEN at that index and `interactive` is `false`

#### Scenario: Viewing the live position
- **WHEN** `viewIndex` is `null`
- **THEN** `position` returns the FEN of the last move and `interactive` is `true`

#### Scenario: Click navigates to move
- **WHEN** `handleMoveClick(index)` is called with an index before the last move
- **THEN** `viewIndex` is set to that index

#### Scenario: Click on last move returns to live
- **WHEN** `handleMoveClick(index)` is called with the index of the last move
- **THEN** `viewIndex` is set to `null`

### Requirement: Hook handles keyboard navigation
`useGameHistory()` SHALL register a `keydown` listener for ←, →, and Esc keys and update `viewIndex` accordingly.

#### Scenario: Left arrow from live position
- **WHEN** `ArrowLeft` is pressed and `viewIndex` is `null`
- **THEN** `viewIndex` is set to `moves.length - 2` (second-to-last move), clamped to 0

#### Scenario: Left arrow steps backward
- **WHEN** `ArrowLeft` is pressed and `viewIndex` is greater than 0
- **THEN** `viewIndex` decrements by 1

#### Scenario: Right arrow steps forward
- **WHEN** `ArrowRight` is pressed and `viewIndex` is not `null` and not at last move
- **THEN** `viewIndex` increments by 1

#### Scenario: Right arrow at last move returns to live
- **WHEN** `ArrowRight` is pressed and `viewIndex` points to the second-to-last move (or later)
- **THEN** `viewIndex` is set to `null`

#### Scenario: Escape returns to live
- **WHEN** `Escape` is pressed
- **THEN** `viewIndex` is set to `null`

#### Scenario: No moves, keys are no-ops
- **WHEN** any navigation key is pressed and `moves` is empty
- **THEN** `viewIndex` remains `null`
