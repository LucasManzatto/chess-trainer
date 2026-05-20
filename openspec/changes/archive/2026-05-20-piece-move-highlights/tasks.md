## 1. Selection State

- [x] 1.1 Add `selectedSquare: Square | null` state to `ChessBoard`
- [x] 1.2 Add `hoveredSquare: Square | null` state to `ChessBoard`

## 2. Move Hint Computation

- [x] 2.1 Derive `hintSquares` (empty destinations) and `captureSquares` in render using `game.moves({ square, verbose: true })`
- [x] 2.2 Split computed moves into two sets: squares with no occupant vs. squares with enemy piece

## 3. Click Interaction Logic

- [x] 3.1 Update `onSquareClick` to select a piece (set `selectedSquare`), execute move if destination is a hint, or deselect if non-hint clicked
- [x] 3.2 Handle re-click on selected piece to deselect

## 4. Visual Overlays

- [x] 4.1 Build `customSquareStyles` record: dot overlay (`radial-gradient`) for `hintSquares`, solid fill for `captureSquares`
- [x] 4.2 Merge hover style into `customSquareStyles` for `hoveredSquare` when it is a hinted square
- [x] 4.3 Wire `onMouseOverSquare`/`onMouseOutSquare` to update `hoveredSquare`

## 5. Verification

- [ ] 5.1 Run the dev server and manually verify: dot on empty squares, highlight on captures, hover fill, deselect on blank click, hints clear after move
