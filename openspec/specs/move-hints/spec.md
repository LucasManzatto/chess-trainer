### Requirement: Show legal move destinations on piece selection
The system SHALL display visual hints on all squares a selected piece can legally move to. Empty destination squares SHALL show a pale green dot at the center of the cell. Squares containing a capturable enemy piece SHALL show a full-cell pale green background highlight.

#### Scenario: Dot appears on empty destination square
- **WHEN** a player clicks a piece that has legal moves to empty squares
- **THEN** each reachable empty square displays a pale green centered dot overlay

#### Scenario: Highlight appears on capture square
- **WHEN** a player clicks a piece that can legally capture an enemy piece
- **THEN** the square containing the capturable piece displays a full-cell pale green background

#### Scenario: No hints for piece with no legal moves
- **WHEN** a player clicks a piece that has zero legal moves
- **THEN** no hint overlays appear on the board

### Requirement: Hover fills hinted square
The system SHALL fill the entire cell of a hinted square with the same pale green color as the dot when the mouse cursor enters that square.

#### Scenario: Hovering empty-destination square fills cell
- **WHEN** the mouse enters a square that has a dot hint
- **THEN** the square's background fills with the pale green color (dot is subsumed by fill)

#### Scenario: Hovering capture square deepens highlight
- **WHEN** the mouse enters a capture-hint square
- **THEN** the square background fill is applied (consistent with dot-square hover)

#### Scenario: Moving mouse off hinted square restores hint style
- **WHEN** the mouse leaves a hinted square
- **THEN** the square returns to its original dot or capture-highlight style

### Requirement: Clear hints on deselect or move
The system SHALL remove all hint overlays when the player clicks a non-hint square, completes a move, or clicks the already-selected piece.

#### Scenario: Clicking non-hint square clears hints
- **WHEN** a piece is selected and hints are shown, and the player clicks a square that is neither a hint nor the selected piece
- **THEN** all hint overlays are removed and no piece is selected

#### Scenario: Completing a move clears hints
- **WHEN** the player clicks a hinted destination square and the move is executed
- **THEN** all hint overlays are removed

#### Scenario: Clicking selected piece deselects
- **WHEN** the player clicks the currently selected piece a second time
- **THEN** all hint overlays are removed and the piece is deselected
