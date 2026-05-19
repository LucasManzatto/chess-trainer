## MODIFIED Requirements

### Requirement: Notify parent on every move
The system SHALL call the `onMove` callback after each accepted move with the move details and resulting FEN. The `onMove` and `onGameOver` callbacks SHALL always reflect the latest function references passed by the caller without requiring the internal drop handler to be recreated.

#### Scenario: Move callback fired
- **WHEN** a legal move is made
- **THEN** `onMove` is called with `{ from, to, san, promotion?, fen }`

#### Scenario: Callback stability across moves
- **WHEN** multiple moves are made in sequence
- **THEN** the `onPieceDrop` handler reference passed to the board renderer does NOT change between moves

#### Scenario: Late-bound callback invocation
- **WHEN** a new `onMove` prop is passed by the parent between moves
- **THEN** the next move fires the new `onMove` function, not the one captured at mount time
