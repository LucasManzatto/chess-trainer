## MODIFIED Requirements

### Requirement: Render interactive chess board
The system SHALL render an 8×8 chess board with pieces in standard starting position by default. The board SHALL be interactive, allowing players to drag-and-drop or click-to-move pieces. When a piece is clicked, the board SHALL enter a selected state for that piece and display legal move hints (see `move-hints` spec); clicking a legal destination executes the move and clears selection; clicking any other square clears selection.

#### Scenario: Board renders with starting position
- **WHEN** `ChessBoard` is mounted with no props
- **THEN** board displays all 32 pieces in standard chess starting position

#### Scenario: Board renders with custom FEN
- **WHEN** `ChessBoard` is mounted with a `position` prop containing a valid FEN string
- **THEN** board displays the position described by that FEN

#### Scenario: Piece click enters selected state
- **WHEN** a player clicks a piece on the board
- **THEN** that square becomes the selected square and legal move hints are rendered

#### Scenario: Click on legal destination executes move
- **WHEN** a piece is selected and the player clicks a hinted destination square
- **THEN** the move is executed, selection is cleared, and all hints are removed

#### Scenario: Click on non-hint square clears selection
- **WHEN** a piece is selected and the player clicks a square that is not a hint
- **THEN** selection and hints are cleared with no move made
