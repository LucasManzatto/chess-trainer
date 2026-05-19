### Requirement: Render interactive chess board
The system SHALL render an 8×8 chess board with pieces in standard starting position by default. The board SHALL be interactive, allowing players to drag-and-drop or click-to-move pieces.

#### Scenario: Board renders with starting position
- **WHEN** `ChessBoard` is mounted with no props
- **THEN** board displays all 32 pieces in standard chess starting position

#### Scenario: Board renders with custom FEN
- **WHEN** `ChessBoard` is mounted with a `position` prop containing a valid FEN string
- **THEN** board displays the position described by that FEN

### Requirement: Enforce legal moves only
The system SHALL prevent illegal moves. Only moves valid under standard chess rules SHALL be accepted.

#### Scenario: Legal move accepted
- **WHEN** a player drags a piece to a valid destination square
- **THEN** the piece moves to that square and the board updates

#### Scenario: Illegal move rejected
- **WHEN** a player drags a piece to an invalid destination square
- **THEN** the piece returns to its original square and the board does not change

### Requirement: Detect and communicate game-ending states
The system SHALL detect checkmate, stalemate, and draw conditions. When detected, the system SHALL call the `onGameOver` callback with the result.

#### Scenario: Checkmate detected
- **WHEN** a move results in checkmate
- **THEN** `onGameOver` is called with `{ result: 'checkmate', winner: 'w' | 'b' }`

#### Scenario: Stalemate detected
- **WHEN** a move results in stalemate
- **THEN** `onGameOver` is called with `{ result: 'stalemate' }`

### Requirement: Notify parent on every move
The system SHALL call the `onMove` callback after each accepted move with the move details and resulting FEN. The callback payload SHALL include the `san` field containing the Standard Algebraic Notation for the move. The `onMove` prop SHALL be read at call time (late-bound) so that a callback reference updated after mount is honoured without requiring a re-render. The component SHALL not require a stable `onMove` reference across renders; consumers MAY pass an inline function without causing move notifications to be skipped.

#### Scenario: Move callback fired
- **WHEN** a legal move is made
- **THEN** `onMove` is called with `{ from, to, promotion?, san, fen }`

#### Scenario: Callback stability — inline function
- **WHEN** the parent passes a new inline `onMove` function on every render
- **THEN** the most-recently-provided function is invoked after each move and no moves are silently dropped

#### Scenario: Late-bound callback invocation
- **WHEN** `onMove` is updated via state or ref after the component mounts and a move is then made
- **THEN** the updated `onMove` function (not the original one captured at mount) is called with the move payload

### Requirement: Support board orientation
The component SHALL accept an `orientation` prop (`'white'` | `'black'`) to flip the board. Default SHALL be `'white'`.

#### Scenario: Black orientation flips board
- **WHEN** `orientation="black"` is passed
- **THEN** rank 1 appears at the top and rank 8 at the bottom

### Requirement: Responsive board sizing
The board SHALL fill its container width while maintaining a 1:1 aspect ratio. The component SHALL accept an optional `boardWidth` prop (number, pixels) to override automatic sizing.

#### Scenario: Board fills container
- **WHEN** `ChessBoard` is rendered without `boardWidth`
- **THEN** board width matches the width of its parent container

#### Scenario: Fixed width override
- **WHEN** `boardWidth={480}` is passed
- **THEN** board renders at exactly 480px wide
