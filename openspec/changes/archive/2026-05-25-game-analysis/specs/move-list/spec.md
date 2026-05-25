## ADDED Requirements

### Requirement: Move tokens are colored by classification when provided
The `MoveList` component SHALL accept an optional `moveClassifications` prop (`MoveClassification[]`, where `MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'`). When provided with the same length as `moves`, each move token SHALL be colored: green for `best`/`excellent`, yellow for `good`/`inaccuracy`, red for `mistake`/`blunder`. When not provided or empty, move tokens SHALL render with default styling.

#### Scenario: Colored moves when classifications match moves length
- **WHEN** `moveClassifications` is provided with the same length as `moves`
- **THEN** each move token is colored according to its classification (green/yellow/red)

#### Scenario: Default styling when no classifications
- **WHEN** `moveClassifications` is not provided
- **THEN** all move tokens render with default (uncolored) styling

#### Scenario: Default styling when lengths mismatch
- **WHEN** `moveClassifications` length differs from `moves` length
- **THEN** all move tokens render with default styling (no partial coloring)
