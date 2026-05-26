## ADDED Requirements

### Requirement: Build move history from a list of SAN moves
The `chess/game.ts` module SHALL export `buildHistoryFromMoves(moves: string[]): HistoryEntry[]`. It SHALL replay the move list from the starting position and return an array of `HistoryEntry` objects, each containing `san`, `fen`, `from`, and `to`. An empty input SHALL return an empty array.

#### Scenario: Valid moves produce correct history
- **WHEN** `buildHistoryFromMoves(['e4', 'e5'])` is called
- **THEN** returns an array of length 2 where `history[0].san === 'e4'` and `history[1].san === 'e5'`

#### Scenario: Each entry contains correct FEN
- **WHEN** `buildHistoryFromMoves(['e4'])` is called
- **THEN** `history[0].fen` is the FEN string after 1.e4 and differs from the starting FEN

#### Scenario: Empty input returns empty array
- **WHEN** `buildHistoryFromMoves([])` is called
- **THEN** returns `[]`

---

### Requirement: Apply a move to a position
The `chess/game.ts` module SHALL export `applyMoveToPosition(currentFen, history, currentIndex, orig, dest)`. It SHALL validate the move and, if legal, return `{ history: HistoryEntry[], newIndex: number, entry: HistoryEntry }`. If the move is illegal it SHALL return `null`.

#### Scenario: Legal move returns updated history
- **WHEN** `applyMoveToPosition` is called with a legal `orig`/`dest` pair
- **THEN** returns a result where `result.entry.san` is the SAN of the move and `result.history.length === currentIndex + 2`

#### Scenario: Illegal move returns null
- **WHEN** `applyMoveToPosition` is called with an illegal `orig`/`dest` pair
- **THEN** returns `null`

#### Scenario: Move from mid-history discards future moves
- **WHEN** `applyMoveToPosition` is called with `currentIndex` pointing to a position before the end of `history`
- **THEN** `result.history` contains only moves up to and including the new move (future branch discarded)

---

### Requirement: Compute FEN for a history index
The `chess/game.ts` module SHALL export `getFenAtIndex(history: HistoryEntry[], index: number | null): string`. When `index` is `null` or equals `history.length - 1`, it SHALL return the FEN of the last entry. When `index` is `-1` (before first move), it SHALL return the standard starting FEN. Otherwise it SHALL return `history[index].fen`.

#### Scenario: Index null returns last FEN
- **WHEN** `getFenAtIndex(history, null)` is called with a non-empty history
- **THEN** returns `history[history.length - 1].fen`

#### Scenario: Index -1 returns starting FEN
- **WHEN** `getFenAtIndex([], -1)` is called
- **THEN** returns the standard chess starting position FEN

#### Scenario: Valid index returns correct FEN
- **WHEN** `getFenAtIndex(history, 0)` is called
- **THEN** returns `history[0].fen`

---

### Requirement: Undo the last move
The `chess/game.ts` module SHALL export `undoLastMove(history: HistoryEntry[], currentIndex: number): { history: HistoryEntry[], newIndex: number }`. It SHALL remove the last entry and decrement the index. If `currentIndex` is `-1` (no moves), it SHALL return the input unchanged.

#### Scenario: Undo removes last move
- **WHEN** `undoLastMove` is called with a history of length 2 and `currentIndex === 1`
- **THEN** returns `{ history: [history[0]], newIndex: 0 }`

#### Scenario: Undo on empty history is a no-op
- **WHEN** `undoLastMove([], -1)` is called
- **THEN** returns `{ history: [], newIndex: -1 }`

---

### Requirement: Parse a PGN string into moves and metadata
The `chess/pgn.ts` module SHALL export `parsePgn(pgn: string): { ok: true; moves: string[]; metadata: GameMetadata } | { ok: false; error: string }`. It SHALL parse the PGN, extract SAN moves and header values (White, Black, Event, Date). Empty or malformed PGN SHALL return `{ ok: false }`.

#### Scenario: Valid PGN returns moves and metadata
- **WHEN** `parsePgn` is called with a valid PGN containing White/Black headers and moves
- **THEN** returns `{ ok: true, moves: [...sans], metadata: { white, black, ... } }`

#### Scenario: PGN with no moves returns error
- **WHEN** `parsePgn` is called with a PGN that has headers but no moves
- **THEN** returns `{ ok: false, error: 'PGN contains no moves.' }`

#### Scenario: Empty string returns error
- **WHEN** `parsePgn('')` is called
- **THEN** returns `{ ok: false, error: 'PGN is empty.' }`

#### Scenario: Malformed PGN returns error
- **WHEN** `parsePgn` is called with a string that is not valid PGN
- **THEN** returns `{ ok: false, error: 'Invalid PGN.' }`

---

### Requirement: Detect hanging and pinned pieces
The `chess/analysis.ts` module SHALL export `computeThreats(fen: string): ThreatSquares`. It SHALL return squares of hanging pieces (attacked and undefended) and pinned pieces (removal exposes own king) for the side to move.

#### Scenario: Hanging piece detected
- **WHEN** `computeThreats` is called with a FEN where a piece is attacked and undefended
- **THEN** that piece's square appears in `result.hanging`

#### Scenario: Pinned piece detected
- **WHEN** `computeThreats` is called with a FEN where a piece is pinned to the king
- **THEN** that piece's square appears in `result.pinned`

#### Scenario: No threats in starting position
- **WHEN** `computeThreats` is called with the standard starting FEN
- **THEN** both `hanging` and `pinned` are empty arrays

---

### Requirement: Compute candidate move shapes from opening continuations
The `chess/analysis.ts` module SHALL export `computeCandidateShapes(candidateMoves: Map<string, number>, boardFen: string | undefined): DrawShape[]`. It SHALL resolve each SAN candidate to its `from`/`to` squares and return green arrow shapes for valid moves.

#### Scenario: Valid candidate moves produce arrows
- **WHEN** `computeCandidateShapes` is called with a candidate map containing `'e4'` and a starting-position FEN
- **THEN** returns a `DrawShape` with `orig: 'e2'`, `dest: 'e4'`, `brush: 'green'`

#### Scenario: Empty candidate map returns empty array
- **WHEN** `computeCandidateShapes(new Map(), fen)` is called
- **THEN** returns `[]`

---

### Requirement: Chess domain module has no framework dependencies
All files in `frontend/src/chess/` SHALL import only from `chess.js`, `@lichess-org/chessground/types` (for type imports only), and other files within `chess/`. They SHALL NOT import from React, Zustand, or any other UI framework.

#### Scenario: No React import in chess module
- **WHEN** any file in `chess/` is statically analysed
- **THEN** no import from `'react'` or `'zustand'` is found

---

### Requirement: Chess domain functions are unit-testable without DOM
All exported functions in `chess/` SHALL be callable in a plain Vitest environment with no DOM (`@vitest/environment: 'node'`).

#### Scenario: Tests run without jsdom
- **WHEN** `vitest run src/chess/__tests__/` is executed with `environment: 'node'`
- **THEN** all tests pass with no DOM-related errors
