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

### Requirement: Filter list to favorites only
The OpeningsList header SHALL include a favorites filter toggle. When active, only openings in the user's favorites set SHALL be shown. The filter SHALL apply after search and works in all three view modes (list, name tree, move tree).

#### Scenario: Favorites filter shows only favorited openings
- **WHEN** the user activates the favorites filter
- **THEN** only openings whose ID is in the favorites store are shown in any view mode

#### Scenario: Favorites filter combines with search
- **WHEN** the favorites filter is active and the user types in the search field
- **THEN** only favorited openings matching the search text are shown

#### Scenario: Favorites filter with no favorites
- **WHEN** the favorites filter is active and the user has no favorites
- **THEN** the "No openings found" empty state is shown

#### Scenario: Favorites filter inactive shows all openings
- **WHEN** the favorites filter is not active
- **THEN** all openings matching search and ECO filter are shown regardless of favorite status

### Requirement: Favorite indicator in all view modes
Each opening row in list, name tree, and move tree views SHALL display a favorite icon. The icon SHALL reflect the current favorite state from the favorites store. Parent nodes in tree views SHALL show an indicator when any descendant is favorited.

#### Scenario: Favorite icon on list item
- **WHEN** an opening is favorited
- **THEN** its row in list view shows a filled star icon

#### Scenario: Partial favorite on tree parent
- **WHEN** a parent node has some but not all descendants favorited
- **THEN** the parent shows a partial indicator (e.g., dim star)

#### Scenario: Fully favorited tree parent
- **WHEN** all descendants of a parent node are favorited
- **THEN** the parent shows a filled star icon
