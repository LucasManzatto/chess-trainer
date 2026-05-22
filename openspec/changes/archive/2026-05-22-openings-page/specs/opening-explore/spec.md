## ADDED Requirements

### Requirement: Interactive board highlights candidate next moves
In the Explore tab the board SHALL be interactive. After each move, all candidate next moves from the openings dataset SHALL be highlighted on the board. Each highlighted square SHALL display the count of openings that include that continuation.

#### Scenario: Starting position shows all first moves
- **WHEN** the Explore tab opens
- **THEN** every square that is a valid first move in any opening is highlighted with a count badge

#### Scenario: Move reduces candidate set
- **WHEN** the user plays 1. e4
- **THEN** only squares reachable by Black's first moves in e4-openings are highlighted, each with a count

#### Scenario: No continuations available
- **WHEN** the user reaches a position that matches no opening in the dataset
- **THEN** no squares are highlighted and a "No openings from here" message appears in the sidebar

### Requirement: Sidebar lists openings matching current position
As the user makes moves, a sidebar SHALL list all openings whose move sequence passes through or ends at the current position.

#### Scenario: Sidebar narrows with each move
- **WHEN** the user plays successive moves
- **THEN** the sidebar list shrinks to only openings consistent with the move sequence so far

#### Scenario: Exact match highlighted in sidebar
- **WHEN** the current position exactly matches a named opening's final position
- **THEN** that opening is visually distinguished (e.g., bold or highlighted) in the sidebar list

### Requirement: User can reset the board to the starting position
A "Reset" button SHALL clear all moves and return the board to the starting position.

#### Scenario: Reset clears position and restores all highlights
- **WHEN** the user clicks "Reset"
- **THEN** the board returns to the starting position and all first-move highlights reappear

### Requirement: User can undo the last move
An "Undo" button SHALL remove the last move and restore the previous position and highlights.

#### Scenario: Undo one move
- **WHEN** the user has played at least one move and clicks "Undo"
- **THEN** the board returns to the previous position and the candidate highlights update accordingly
