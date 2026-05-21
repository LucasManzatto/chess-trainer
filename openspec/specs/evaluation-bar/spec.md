## ADDED Requirements

### Requirement: Render evaluation bar
The system SHALL render a vertical bar divided into a white region (bottom) and a black region (top). The proportion of white to black SHALL reflect the current evaluation: equality renders a 50/50 split; white advantage grows the white region upward; black advantage grows the black region downward. Centipawn scores SHALL be clamped to ±1000 cp for bar sizing — scores beyond ±10 pawns render as a near-full bar on the winning side.

#### Scenario: Equal position renders 50/50 bar
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: 0 }}`
- **THEN** white and black regions each occupy 50% of the bar height

#### Scenario: White advantage shifts bar toward white
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: 300 }}`
- **THEN** the white region occupies more than 50% of the bar height

#### Scenario: Black advantage shifts bar toward black
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: -300 }}`
- **THEN** the black region occupies more than 50% of the bar height

#### Scenario: Large score clamps to near-full bar
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: 2000 }}`
- **THEN** the white region renders as if the score were clamped to 1000 cp (not beyond the maximum)

### Requirement: Display numeric score label
The system SHALL display a numeric score label at the edge of the winning side's region. Centipawn scores SHALL be displayed in pawn units rounded to one decimal place (e.g. `+2.3`, `-0.8`). The `+` sign SHALL be shown for positive scores; `0.0` for equality. The label SHALL be positioned inside the bar, near the boundary between the two regions.

#### Scenario: Positive centipawn score displayed
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: 230 }}`
- **THEN** the label reads `+2.3`

#### Scenario: Negative centipawn score displayed
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: -80 }}`
- **THEN** the label reads `-0.8`

#### Scenario: Zero score displayed
- **WHEN** `EvaluationBar` receives `score={{ type: 'cp', value: 0 }}`
- **THEN** the label reads `0.0`

### Requirement: Display mate score
When the position has a forced mate, the system SHALL display the mate count instead of a centipawn value. The bar SHALL render as fully white (side to move wins) or fully black (side to move loses) based on the mate sign. The label SHALL read `M<n>` for side-to-move winning and `-M<n>` for side-to-move losing, where `n` is the absolute number of moves to mate.

#### Scenario: Winning mate displayed
- **WHEN** `EvaluationBar` receives `score={{ type: 'mate', value: 3 }}`
- **THEN** the bar is fully white and the label reads `M3`

#### Scenario: Losing mate displayed
- **WHEN** `EvaluationBar` receives `score={{ type: 'mate', value: -2 }}`
- **THEN** the bar is fully black and the label reads `-M2`

### Requirement: Show loading state
While the engine is evaluating a new position, the system SHALL display a loading indicator on the bar (e.g. subtle pulse animation) and SHALL retain the previous evaluation score in the bar rather than resetting to zero.

#### Scenario: Bar retains previous score while loading
- **WHEN** `isLoading` is `true` and a previous score exists
- **THEN** the bar continues to show the previous score with a loading indicator overlay

#### Scenario: Bar shows neutral state on initial load
- **WHEN** `isLoading` is `true` and no previous score exists
- **THEN** the bar renders a 50/50 split with a loading indicator

### Requirement: Smooth score transitions
Score changes SHALL animate smoothly rather than jumping. The bar split percentage SHALL transition over 300ms using a CSS transition.

#### Scenario: Bar animates on score change
- **WHEN** the evaluation score changes from `+1.0` to `+3.0`
- **THEN** the bar region smoothly expands over approximately 300ms rather than snapping
