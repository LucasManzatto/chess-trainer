## Requirements

### Requirement: Opening list with search and ECO filter
The Browse tab SHALL display a scrollable list of openings. Users SHALL be able to filter by ECO group (A, B, C, D, E) and search by name. Filtering and search SHALL run client-side with no API call.

#### Scenario: ECO filter narrows list
- **WHEN** the user selects ECO group "C"
- **THEN** only openings with ECO codes C00–C99 appear in the list

#### Scenario: Name search filters list
- **WHEN** the user types "Sicilian" in the search input
- **THEN** only openings whose name contains "Sicilian" (case-insensitive) are shown

#### Scenario: Combined filter and search
- **WHEN** the user selects ECO "B" and types "Caro"
- **THEN** only ECO-B openings whose name contains "Caro" are shown

#### Scenario: Empty results state
- **WHEN** search + filter produce no matches
- **THEN** a "No openings found" message is shown instead of an empty list

### Requirement: Selecting an opening updates board and move list
When the user clicks an opening in the list, the ChessBoard SHALL update to show the final position of that opening and the MoveList SHALL display all moves.

#### Scenario: Click opening shows final position
- **WHEN** the user clicks an opening in the list
- **THEN** the ChessBoard shows the position after all moves of that opening

#### Scenario: Click move in MoveList updates board
- **WHEN** the user clicks move N in the MoveList
- **THEN** the ChessBoard shows the position after move N (not the final position)

#### Scenario: No opening selected on initial load
- **WHEN** the Browse tab first renders
- **THEN** the board shows the starting position and the move list is empty

### Requirement: Opening details panel shows ECO and name
When an opening is selected, the right panel SHALL display the ECO code and full opening name above the MoveList.

#### Scenario: Opening details visible after selection
- **WHEN** the user selects an opening
- **THEN** the panel header shows the ECO code (e.g., "C65") and name (e.g., "Ruy Lopez: Berlin Defense")

### Requirement: Continuations panel shows next possible moves when opening is selected
When an opening is selected in BrowseTab, the moves column SHALL display a continuations panel listing candidate next moves derived from the full openings trie at the current move position. The panel SHALL be hidden when no opening is selected. Continuations SHALL be sorted by descending opening count.

#### Scenario: Continuations appear on opening selection
- **WHEN** the user selects an opening in BrowseTab
- **THEN** the moves column shows a "Continuations" section listing all next moves possible from the opening's final position, each with a count

#### Scenario: Continuations update on move navigation
- **WHEN** the user clicks move N in the MoveList
- **THEN** the continuations panel updates to show candidate next moves from position after move N

#### Scenario: Continuations hidden with no selection
- **WHEN** no opening is selected
- **THEN** the continuations panel is not rendered

#### Scenario: Empty continuations at leaf position
- **WHEN** the current position is a leaf in the openings trie (no known continuations)
- **THEN** the continuations panel is not rendered (empty map renders nothing)
