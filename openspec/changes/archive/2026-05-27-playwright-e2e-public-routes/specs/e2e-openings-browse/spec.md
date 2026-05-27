## ADDED Requirements

### Requirement: Openings list loads from static asset
The E2E test SHALL verify that navigating to `/openings` renders a list of openings loaded from the static `openings.json` file, without any backend dependency.

#### Scenario: Openings list is populated on page load
- **WHEN** a user navigates to `/openings`
- **THEN** at least one opening item is visible in the list within 10 seconds

### Requirement: Search filters the openings list
The E2E test SHALL verify that typing in the search input narrows the displayed openings.

#### Scenario: Searching for "Sicilian" filters results
- **WHEN** the user types "Sicilian" into the search input
- **THEN** all visible opening items contain the text "Sicilian"

#### Scenario: Search with no matches shows empty list
- **WHEN** the user types "xyzxyzxyz" into the search input
- **THEN** no opening items are visible in the list

### Requirement: Selecting an opening updates the board
The E2E test SHALL verify that clicking an opening in the list loads its moves onto the chess board.

#### Scenario: Clicking an opening populates the move list
- **WHEN** the user searches for "Sicilian" and clicks the first result
- **THEN** the move list panel contains at least one move entry

#### Scenario: Board changes from starting position after selection
- **WHEN** the user selects an opening that has at least one move
- **THEN** the `cg-board` piece positions differ from the initial starting position
