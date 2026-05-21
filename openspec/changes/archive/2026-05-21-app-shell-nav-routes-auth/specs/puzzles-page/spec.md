## ADDED Requirements

### Requirement: Puzzles index route exists at /puzzles
A route SHALL exist at `/puzzles` defined in `src/routes/puzzles/index.tsx`. The page SHALL be publicly accessible. It SHALL render a placeholder UI indicating the feature is coming.

#### Scenario: /puzzles resolves without 404
- **WHEN** the user navigates to `/puzzles`
- **THEN** the puzzles page renders with the top nav visible and no error

#### Scenario: /puzzles accessible without login
- **WHEN** an unauthenticated user navigates to `/puzzles`
- **THEN** the page renders normally (no auth redirect)

### Requirement: Puzzle detail route exists at /puzzles/:puzzleId
A route SHALL exist at `/puzzles/:puzzleId` defined in `src/routes/puzzles/$puzzleId.tsx`. The page SHALL be publicly accessible and render a placeholder referencing the puzzle ID.

#### Scenario: /puzzles/:puzzleId resolves
- **WHEN** the user navigates to `/puzzles/abc123`
- **THEN** the puzzle detail page renders with the puzzleId param accessible and no 404
