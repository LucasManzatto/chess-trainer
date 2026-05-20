## MODIFIED Requirements

### Requirement: Auto-scroll to latest move
The list SHALL scroll automatically to bring the most recent move into view when a new move is added. The list SHALL also scroll to bring the token at `selectedIndex` into view whenever `selectedIndex` changes, using `block: 'nearest'` so no scroll occurs if the token is already visible.

#### Scenario: New move added below scroll viewport
- **WHEN** move count exceeds the visible list height and a new move is added
- **THEN** the list scrolls so the newest move is visible without user interaction

#### Scenario: Selected move scrolled into view on navigation
- **WHEN** `selectedIndex` changes (e.g., via keyboard arrow key) and the corresponding token is above or below the visible scroll area
- **THEN** the list scrolls the minimum distance needed to make that token visible

#### Scenario: No scroll when selected token already visible
- **WHEN** `selectedIndex` changes to a token already within the visible scroll area
- **THEN** the list does not scroll
