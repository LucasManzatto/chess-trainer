### Requirement: Two-column board and move list layout
The main page SHALL render the chess board and move list side by side in a two-column layout on screens wider than 768px.

#### Scenario: Wide screen two-column layout
- **WHEN** viewport width is ≥ 768px
- **THEN** board occupies the left column and move list occupies the right column, both vertically aligned at the top

#### Scenario: Narrow screen stacked layout
- **WHEN** viewport width is < 768px
- **THEN** board renders above the move list in a single column

### Requirement: Board column constrains board width
The board column SHALL have a fixed max-width so the board does not grow excessively on ultra-wide screens. The move list column SHALL take remaining width.

#### Scenario: Board max-width respected
- **WHEN** viewport is very wide (>1400px)
- **THEN** the board column stops growing at its max-width and the move list column fills the remainder
