## ADDED Requirements

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
