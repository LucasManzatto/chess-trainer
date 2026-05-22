## Requirements

### Requirement: Comments require authentication
Comment creation, editing, and deletion SHALL require the user to be authenticated. Unauthenticated users SHALL see existing comments as read-only (if any exist for public future use) but SHALL NOT see comment input fields.

#### Scenario: Unauthenticated user sees no comment inputs
- **WHEN** an unauthenticated user views an opening
- **THEN** no textarea or "Add comment" button is visible

### Requirement: Opening-level comments
Authenticated users SHALL be able to add, edit, and delete a text comment on an opening as a whole. Comments are private (only visible to the author).

#### Scenario: Add opening comment
- **WHEN** an authenticated user types in the opening comment field and submits
- **THEN** the comment is saved and displayed in the panel

#### Scenario: Edit opening comment
- **WHEN** the user clicks the edit icon on their own opening comment
- **THEN** the comment text becomes editable in-place; saving updates it

#### Scenario: Delete opening comment
- **WHEN** the user clicks the delete icon on their own opening comment and confirms
- **THEN** the comment is removed

#### Scenario: Comment persists across sessions
- **WHEN** the user logs out and back in and views the same opening
- **THEN** their previously saved comment is shown

### Requirement: Move-level (position) comments
Authenticated users SHALL be able to add, edit, and delete a text comment on any individual move within an opening. A 💬 icon SHALL appear next to each move in the MoveList.

#### Scenario: Add position comment
- **WHEN** the user clicks the 💬 icon on move N and types a comment
- **THEN** the comment is saved and associated with opening ID + move index N

#### Scenario: Move with existing comment shows filled icon
- **WHEN** a move already has a comment from the current user
- **THEN** the 💬 icon appears in a highlighted/filled state

#### Scenario: Edit position comment
- **WHEN** the user clicks the filled 💬 icon on a move with an existing comment
- **THEN** the existing comment is shown in an editable field; saving updates it

#### Scenario: Delete position comment
- **WHEN** the user deletes a position comment
- **THEN** the 💬 icon returns to its unfilled state

### Requirement: Comments visible in Browse, Explore, and Drill
Opening-level and position-level comments SHALL be visible whenever that opening is displayed, regardless of which tab the user is in.

#### Scenario: Comment shown in Drill mode
- **WHEN** the user drills an opening they have previously annotated
- **THEN** their opening-level comment is visible in the drill UI
