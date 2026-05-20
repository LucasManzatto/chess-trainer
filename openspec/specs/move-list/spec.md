### Requirement: Render move history in algebraic notation pairs
The `MoveList` component SHALL accept a `moves` prop (array of `string`, where each string is a SAN token), a `selectedIndex` prop (`number | null`, default `null`), and an `onMoveClick` prop (`(index: number) => void`, optional). The component SHALL render moves grouped into move pairs: move number, white's move, black's move. Each move token SHALL be rendered as a `<button>` element; clicking a token SHALL call `onMoveClick` with the flat 0-based index of that token in the `moves` array. The component SHALL NOT depend on `MoveResult` or any move-object type; all move data is conveyed as plain strings.

#### Scenario: Empty move list
- **WHEN** `moves` is an empty array
- **THEN** component renders a placeholder ("No moves yet" or equivalent) and no move rows

#### Scenario: Single move (white only)
- **WHEN** `moves` has one entry (white's first move)
- **THEN** component renders "1. e4" as a button with an empty slot for black's move

#### Scenario: Full move pair
- **WHEN** `moves` has two entries
- **THEN** component renders "1. e4 e5" on a single row with each token as a button

#### Scenario: Multiple move pairs
- **WHEN** `moves` has N entries
- **THEN** component renders ⌈N/2⌉ rows, each with a move number and up to two SAN token buttons

#### Scenario: Click fires onMoveClick with correct index
- **WHEN** the user clicks a move token
- **THEN** `onMoveClick` is called with the flat 0-based index of that token (0 = white's first move, 1 = black's first move, etc.)

### Requirement: Highlight the selected move
The move token at `selectedIndex` SHALL be visually distinguished (background highlight or bold text). When `selectedIndex` is `null` or out of range, no token is highlighted.

#### Scenario: Selected move highlighted
- **WHEN** `selectedIndex` is a valid index into `moves`
- **THEN** only the token at that index has the distinct highlight style

#### Scenario: No highlight when selectedIndex is null
- **WHEN** `selectedIndex` is `null`
- **THEN** no move token is highlighted

### Requirement: Auto-scroll to latest move
The list SHALL scroll automatically to bring the most recent move into view when a new move is added. The list SHALL also scroll to bring the token at `selectedIndex` into view whenever `selectedIndex` changes, using `block: 'nearest'` so no scroll occurs if the token is already visible.

#### Scenario: New move added below scroll viewport
- **WHEN** move count exceeds the visible list height and a new move is added
- **THEN** the list scrolls so the newest move is visible without user interaction

#### Scenario: Selected move scrolled into view on navigation
- **WHEN** `selectedIndex` changes (e.g., via keyboard arrow key) and the corresponding token is above or below the visible scroll area
- **THEN** the list scrolls the minimum distance needed to make that token visible

#### Scenario: No scroll when selected token already visible
- **WHEN** `selectedIndex` changes to a token already within the visible scroll area
- **THEN** the list does not scroll

### Requirement: Fixed height with internal scroll
The `MoveList` SHALL have a fixed or max-height with `overflow-y: auto` so it does not push the board off-screen when the game is long.

#### Scenario: Long game does not expand layout
- **WHEN** `moves` contains 80+ entries (40 move pairs)
- **THEN** the component's outer height does not grow beyond its max-height and internal scroll handles overflow
