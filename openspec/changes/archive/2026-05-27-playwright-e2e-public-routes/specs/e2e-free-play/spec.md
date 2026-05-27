## ADDED Requirements

### Requirement: Free Play board renders on navigation
The E2E test SHALL verify that navigating to `/` renders a playable chess board with pieces in starting position.

#### Scenario: Board is visible on page load
- **WHEN** a user navigates to `/`
- **THEN** a `cg-board` element is visible in the DOM

#### Scenario: White pieces are present at start
- **WHEN** the page finishes loading
- **THEN** at least one `piece.white.pawn` element exists inside `cg-board`

### Requirement: A pawn move can be made via board interaction
The E2E test SHALL verify that clicking a piece then a destination square results in the move appearing in the move list.

#### Scenario: Moving e2 pawn to e4
- **WHEN** the user clicks the square at e2 then clicks the square at e4
- **THEN** the move list panel contains the text "e4"

#### Scenario: Board reflects the move
- **WHEN** the e2-e4 move completes
- **THEN** a `piece.white.pawn` is present at position e4 (no pawn remains at e2)
