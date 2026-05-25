## ADDED Requirements

### Requirement: Selecting a game loads it onto the board for read-only replay
When a user selects a game from the games list, the board SHALL load the game's moves and display the final position. The board SHALL be non-interactive (no piece dragging). The user SHALL be able to navigate moves using left/right arrow keys or clicking move entries in the move list.

#### Scenario: Game loads on selection
- **WHEN** a user clicks a game in the games list
- **THEN** the board displays the game's final position and the move list shows all moves

#### Scenario: Navigate backward through moves
- **WHEN** a game is loaded and the user presses the left arrow key or clicks a previous move
- **THEN** the board shows the position after that move

#### Scenario: Navigate forward through moves
- **WHEN** the user is viewing a non-final position and presses the right arrow key or clicks a later move
- **THEN** the board advances to the next position

#### Scenario: Board orientation matches user's color
- **WHEN** a game loads where the user played as black
- **THEN** the board is oriented with black on the bottom

### Requirement: Eval bar shows engine evaluation for the current replay position
While replaying a game, an evaluation bar SHALL be displayed beside the board showing the Stockfish engine evaluation for the current position. The eval bar SHALL update as the user navigates moves.

#### Scenario: Eval bar updates on move navigation
- **WHEN** a user navigates to a different move in the replay
- **THEN** the eval bar shows the engine evaluation for the resulting position

#### Scenario: Eval bar shows loading state during computation
- **WHEN** the user navigates to a position and the engine has not yet evaluated it
- **THEN** the eval bar displays a loading indicator

### Requirement: No game selected shows an empty board state
When no game is selected, the board area SHALL display a placeholder prompt.

#### Scenario: Empty state before game selection
- **WHEN** the Games tab is open and no game has been selected
- **THEN** the board area shows a message prompting the user to select a game from the list
