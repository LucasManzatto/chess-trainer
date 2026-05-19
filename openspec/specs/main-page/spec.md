### Requirement: Display chess board centered on main page
The main page SHALL render the `ChessBoard` and `MoveList` components together in a two-column layout centered in the viewport. The board is no longer the sole element — it occupies the left column, with the move list on the right.

#### Scenario: Board and move list visible together
- **WHEN** user opens the app at the root route
- **THEN** both the chess board and the move list are visible on screen side by side (on wide screens)

#### Scenario: Move list updates as player moves
- **WHEN** a piece is moved on the board
- **THEN** the move list updates immediately to show the new move in SAN notation

### Requirement: Replace default Vite starter content
The main page SHALL NOT contain any Vite or React boilerplate content (logos, counter button, links).

#### Scenario: No starter content visible
- **WHEN** the app loads
- **THEN** no Vite logos, React logos, or demo counter elements are present in the DOM

### Requirement: Minimal, unobtrusive layout
The page SHALL have a neutral background that does not compete with the chess board. No navigation, sidebars, or footer are required at this stage.

#### Scenario: Clean layout
- **WHEN** the main page renders
- **THEN** the page shows only the chess board with a plain background color
