## MODIFIED Requirements

### Requirement: Render move history in algebraic notation pairs
The `MoveList` component SHALL accept a `moves` prop of type `string[]` (SAN strings) and render them grouped into move pairs: move number, white's move, black's move. The component SHALL NOT depend on the `MoveResult` type or any chess-domain object.

#### Scenario: Empty move list
- **WHEN** `moves` is an empty array
- **THEN** component renders a placeholder and no move rows

#### Scenario: Single move (white only)
- **WHEN** `moves` has one entry
- **THEN** component renders "1. e4" with an empty slot for black's move

#### Scenario: Full move pair
- **WHEN** `moves` has two entries
- **THEN** component renders "1. e4 e5" on a single row

#### Scenario: Multiple move pairs
- **WHEN** `moves` has N entries
- **THEN** component renders ⌈N/2⌉ rows with correct move numbers and SAN tokens
