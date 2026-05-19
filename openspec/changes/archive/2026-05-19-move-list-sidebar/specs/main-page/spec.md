## MODIFIED Requirements

### Requirement: Display chess board centered on main page
The main page SHALL render the `ChessBoard` and `MoveList` components together in a two-column layout centered in the viewport. The board is no longer the sole element — it occupies the left column, with the move list on the right.

#### Scenario: Board and move list visible together
- **WHEN** user opens the app at the root route
- **THEN** both the chess board and the move list are visible on screen side by side (on wide screens)

#### Scenario: Move list updates as player moves
- **WHEN** a piece is moved on the board
- **THEN** the move list updates immediately to show the new move in SAN notation
