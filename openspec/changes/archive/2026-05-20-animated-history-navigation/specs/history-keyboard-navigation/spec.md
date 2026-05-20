## ADDED Requirements

### Requirement: Navigate history backward with left arrow key
The system SHALL move the board one move backward in history when the left arrow key is pressed, provided at least one move exists in history.

#### Scenario: Left arrow from live mode steps back one move
- **WHEN** the board is in live mode (showing the latest position) and the left arrow key is pressed
- **THEN** the board displays the position after the second-to-last move and the corresponding move in the list is highlighted

#### Scenario: Left arrow from a history position steps back one more move
- **WHEN** the board is viewing a historical position (not the latest) and the left arrow key is pressed
- **THEN** the board displays the position one move earlier and the corresponding move is highlighted

#### Scenario: Left arrow at the start of the game is a no-op
- **WHEN** the board is displaying the starting position (before move 1) and the left arrow key is pressed
- **THEN** the board position and selected move do not change

### Requirement: Navigate history forward with right arrow key
The system SHALL move the board one move forward in history when the right arrow key is pressed, provided a next move exists.

#### Scenario: Right arrow from a history position steps forward one move
- **WHEN** the board is viewing a historical position and the right arrow key is pressed
- **THEN** the board displays the position one move later and the corresponding move is highlighted

#### Scenario: Right arrow at the latest move returns to live mode
- **WHEN** the board is viewing the second-to-last move and the right arrow key is pressed
- **THEN** the board returns to live mode (latest position, interactive)

#### Scenario: Right arrow in live mode is a no-op
- **WHEN** the board is in live mode and the right arrow key is pressed
- **THEN** the board position and selected move do not change

### Requirement: Return to live mode with Escape key
The system SHALL return to live mode (latest position, board interactive) when the Escape key is pressed while in a historical position.

#### Scenario: Escape from history returns to live
- **WHEN** the board is viewing a historical position and Escape is pressed
- **THEN** the board displays the latest position, the board becomes interactive, and the last move in the list is highlighted

#### Scenario: Escape in live mode is a no-op
- **WHEN** the board is already in live mode and Escape is pressed
- **THEN** no change occurs
