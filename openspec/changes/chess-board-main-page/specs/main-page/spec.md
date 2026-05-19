## ADDED Requirements

### Requirement: Display chess board centered on main page
The main page SHALL render the `ChessBoard` component centered both horizontally and vertically in the viewport.

#### Scenario: Board is centered
- **WHEN** user opens the app at the root route
- **THEN** the chess board appears centered on the page with equal space on all sides

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
