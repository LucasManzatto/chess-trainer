## MODIFIED Requirements

### Requirement: Render interactive chess board
The system SHALL render an 8×8 chess board with pieces in standard starting position by default. The board SHALL be interactive, allowing players to drag-and-drop or click-to-move pieces. When a piece is clicked, the board SHALL enter a selected state for that piece and display legal move hints (see `move-hints` spec); clicking a legal destination executes the move and clears selection; clicking any other square clears selection. The board SHALL animate piece movements for both live moves and programmatic position changes (history navigation), with a configurable duration.

#### Scenario: Board renders with starting position
- **WHEN** `ChessBoard` is mounted with no props
- **THEN** board displays all 32 pieces in standard chess starting position

#### Scenario: Board renders with custom FEN
- **WHEN** `ChessBoard` is mounted with a `position` prop containing a valid FEN string
- **THEN** board displays the position described by that FEN

#### Scenario: Piece animates on position change
- **WHEN** the `position` prop changes to a FEN differing by one piece movement
- **THEN** the affected piece slides from its old square to its new square over `animationDurationInMs` milliseconds

#### Scenario: Animation duration is configurable
- **WHEN** `ChessBoard` is mounted with `animationDurationInMs={500}`
- **THEN** piece movements animate over 500ms
