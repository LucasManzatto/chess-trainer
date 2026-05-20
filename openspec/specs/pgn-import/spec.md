## ADDED Requirements

### Requirement: User can paste PGN to load a game
The app SHALL provide a `PgnImportPanel` component with a textarea and a submit button. When submitted, the PGN text SHALL be parsed and loaded into the board for review. On success, the panel SHALL close automatically.

#### Scenario: Valid PGN loads game
- **WHEN** the user pastes a valid PGN into the textarea and clicks the import button
- **THEN** the board loads the final position of the game, the move list shows all moves, and the last move is highlighted

#### Scenario: Invalid PGN shows error
- **WHEN** the user submits malformed or empty PGN text
- **THEN** an inline error message is displayed below the textarea and the panel stays open

#### Scenario: Panel closes on success
- **WHEN** a valid PGN is successfully imported
- **THEN** the import panel closes and the board is visible

### Requirement: Import panel is toggleable
A button on the free-play page SHALL toggle the `PgnImportPanel` open and closed.

#### Scenario: Toggle opens panel
- **WHEN** the user clicks the import button and the panel is closed
- **THEN** the panel opens with an empty textarea

#### Scenario: Toggle closes panel
- **WHEN** the user clicks the import button and the panel is already open
- **THEN** the panel closes

### Requirement: Game metadata is displayed when a PGN game is loaded
When a PGN game is loaded, headers (White, Black, Event, Date) present in the PGN SHALL be displayed above the move list. When no PGN game is loaded (free play), no metadata is shown.

#### Scenario: Metadata shown after PGN import
- **WHEN** a PGN with White, Black, and Event headers is imported
- **THEN** the move list panel shows those values above the move list

#### Scenario: No metadata during free play
- **WHEN** the user is in free play mode (no PGN imported)
- **THEN** no game metadata header is visible
