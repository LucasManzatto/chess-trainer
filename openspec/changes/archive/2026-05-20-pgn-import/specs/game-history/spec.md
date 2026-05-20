## ADDED Requirements

### Requirement: Hook can load a full game from PGN text
`useGameHistory()` SHALL expose a `loadFromPgn(pgn: string)` function. On success it SHALL replace `moves` with the parsed move list, set `viewIndex` to the last move index, set `gameMetadata` to the parsed PGN headers, and return `{ ok: true }`. On failure it SHALL leave existing state unchanged and return `{ ok: false; error: string }`.

#### Scenario: Valid PGN replaces game state
- **WHEN** `loadFromPgn` is called with valid PGN text
- **THEN** `moves` contains the parsed moves, `viewIndex` is `moves.length - 1`, and `gameMetadata` contains header values

#### Scenario: Invalid PGN returns error, state unchanged
- **WHEN** `loadFromPgn` is called with invalid PGN text
- **THEN** returns `{ ok: false, error: <message> }` and `moves` / `viewIndex` are unchanged

#### Scenario: Empty string is invalid
- **WHEN** `loadFromPgn` is called with an empty string
- **THEN** returns `{ ok: false, error: <message> }`

### Requirement: Hook exposes game metadata
`useGameHistory()` SHALL expose a `gameMetadata` value of type `GameMetadata | null`. It SHALL be `null` during free play and populated after a successful `loadFromPgn` call.

#### Scenario: gameMetadata is null on init
- **WHEN** `useGameHistory()` is first called
- **THEN** `gameMetadata` is `null`

#### Scenario: gameMetadata populated after import
- **WHEN** `loadFromPgn` succeeds
- **THEN** `gameMetadata` reflects White, Black, Event, Date headers from the PGN (absent headers are undefined)
