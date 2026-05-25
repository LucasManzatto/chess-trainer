## ADDED Requirements

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
