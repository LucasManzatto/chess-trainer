### Requirement: Navigate to historical board position
The system SHALL allow the user to click any move token in `MoveList` to jump the board to the position that existed after that move. The board SHALL be read-only (no moves accepted) for all positions except the live (latest) position.

#### Scenario: Click historical move
- **WHEN** the user clicks a move token that is not the last move in the list
- **THEN** the board updates to show the position after that move and no piece moves are accepted

#### Scenario: Board locked during review
- **WHEN** the board is displaying a historical position (not the live position)
- **THEN** attempting to drag or click a piece results in no move and the piece returns to its square

### Requirement: Return to live position
The system SHALL automatically restore interactive mode when the user navigates back to the latest move.

#### Scenario: Click last move restores live mode
- **WHEN** the user clicks the last move token in the list
- **THEN** the board shows the current game position and piece moves are accepted again

#### Scenario: Live position is interactive
- **WHEN** no historical move is selected (view is at the latest position)
- **THEN** the board accepts legal piece moves and game play continues normally
