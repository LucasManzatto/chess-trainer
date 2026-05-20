## ADDED Requirements

### Requirement: Read-only mode via `interactive` prop
The component SHALL accept an optional `interactive` prop (boolean, default `true`). When `interactive` is `false`, all piece drop attempts SHALL be rejected and the board SHALL be visually non-interactive (no moves accepted).

#### Scenario: Interactive prop defaults to true
- **WHEN** `ChessBoard` is mounted without an `interactive` prop
- **THEN** the board behaves as interactive (piece moves are accepted as normal)

#### Scenario: Non-interactive board rejects moves
- **WHEN** `interactive={false}` is passed and the user attempts to drop a piece
- **THEN** the piece returns to its original square and no move is recorded

#### Scenario: Switching to interactive re-enables moves
- **WHEN** `interactive` changes from `false` to `true`
- **THEN** the board immediately accepts legal piece moves again
