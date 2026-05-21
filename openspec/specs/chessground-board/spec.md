### Requirement: Native drag-and-drop with no ghost piece artifact
The board SHALL use `@lichess-org/chessground`'s built-in pointer-event drag handling. No external drag library (dnd-kit or similar) SHALL be used. The dragged piece ghost SHALL always be cleaned up when the pointer is released or the drag is cancelled, regardless of whether the window loses focus during the drag.

#### Scenario: Drag completes after window blur
- **WHEN** the user starts dragging a piece, the browser window loses focus, and the user releases the mouse
- **THEN** no ghost piece remains on the source square after pointer release

#### Scenario: Drag cancelled by pressing Escape
- **WHEN** the user starts dragging a piece and presses Escape
- **THEN** the piece returns to its source square with no ghost artifact

### Requirement: Legal move pre-computation via dests map
The board SHALL pre-compute all legal destinations for the side to move and pass them to chessground as `movable.dests`. Only pre-computed destinations SHALL be reachable by drag or click. chess.js SHALL be the authoritative source for legal move computation.

#### Scenario: Only legal squares are droppable
- **WHEN** a piece is dragged over a square not in its legal destinations
- **THEN** the square does not show a drop indicator and the piece returns to source on release

#### Scenario: Dests recomputed after each move
- **WHEN** a move is made
- **THEN** the dests map is recomputed for the new position and the new side to move

### Requirement: React wrapper mounts chessground imperatively
A `ChessGround` React component SHALL mount the chessground instance once via `useEffect` on a `<div>` ref. Subsequent config changes (FEN, dests, orientation, etc.) SHALL be applied via `api.set(partialConfig)` without unmounting. The instance SHALL be destroyed on component unmount.

#### Scenario: Single mount per component lifetime
- **WHEN** `ChessGround` is rendered and config props change repeatedly
- **THEN** `Chessground(el, config)` is called exactly once; only `api.set()` is called for subsequent updates

#### Scenario: Cleanup on unmount
- **WHEN** the `ChessGround` component is removed from the DOM
- **THEN** `api.destroy()` is called, removing all event listeners and DOM nodes added by chessground
