### Requirement: Render move history in algebraic notation pairs
The `MoveList` component SHALL accept a `moves` prop (array of `string`, where each string is a SAN token) and render them grouped into move pairs: move number, white's move, black's move. The component SHALL NOT depend on `MoveResult` or any move-object type; all move data is conveyed as plain strings.

#### Scenario: Empty move list
- **WHEN** `moves` is an empty array
- **THEN** component renders a placeholder ("No moves yet" or equivalent) and no move rows

#### Scenario: Single move (white only)
- **WHEN** `moves` has one entry (white's first move)
- **THEN** component renders "1. e4" with an empty slot for black's move

#### Scenario: Full move pair
- **WHEN** `moves` has two entries
- **THEN** component renders "1. e4 e5" on a single row

#### Scenario: Multiple move pairs
- **WHEN** `moves` has N entries
- **THEN** component renders ⌈N/2⌉ rows, each with a move number and up to two SAN tokens

### Requirement: Highlight the most recent move
The last move in the list SHALL be visually distinguished (background highlight or bold text).

#### Scenario: Latest move highlighted
- **WHEN** `moves` has at least one entry
- **THEN** the last move token has a distinct visual style compared to earlier moves

### Requirement: Auto-scroll to latest move
The list SHALL scroll automatically to bring the most recent move into view when a new move is added.

#### Scenario: New move added below scroll viewport
- **WHEN** move count exceeds the visible list height and a new move is added
- **THEN** the list scrolls so the newest move is visible without user interaction

### Requirement: Fixed height with internal scroll
The `MoveList` SHALL have a fixed or max-height with `overflow-y: auto` so it does not push the board off-screen when the game is long.

#### Scenario: Long game does not expand layout
- **WHEN** `moves` contains 80+ entries (40 move pairs)
- **THEN** the component's outer height does not grow beyond its max-height and internal scroll handles overflow
