## Context

App currently tracks `MoveResult[]` in `App.tsx` and passes only `string[]` (SAN tokens) to `MoveList`. `ChessBoard` is always interactive — there is no mechanism to make it read-only. `MoveList` renders tokens as plain text with no click handling.

## Goals / Non-Goals

**Goals:**
- Let users click any move token to view that board position
- Board is read-only for all historical positions; interactive only at the live (latest) position
- Clicking the latest move token restores live/interactive mode

**Non-Goals:**
- Keyboard navigation (arrow keys through moves)
- Move annotation or comments
- Branching / variation trees
- Server-side position storage or replay

## Decisions

### 1. `viewIndex: number | null` lifted to `App.tsx`

`null` = live game (latest position, board interactive). A number = user is reviewing the move at that flat index in the `moves` array.

App derives `position` and `interactive` from this single value:
- `position = viewIndex !== null ? moves[viewIndex].fen : moves.at(-1)?.fen`
- `interactive = viewIndex === null`

**Alt: Zustand store** — overkill for one value that only `App` needs to coordinate between two children.

**Alt: state inside MoveList** — MoveList has no access to FEN data, so it could not drive the board.

### 2. `interactive?: boolean` prop on `ChessBoard` (default `true`)

When `false`, `handlePieceDrop` returns `false` immediately before any chess.js computation. No structural changes to the component.

**Alt: omit `onPieceDrop` from Chessboard options when not interactive** — works but complicates the options object construction. The prop guard is a one-liner.

### 3. Clicking the last move sets `viewIndex` to `null`

App checks `if (index === moves.length - 1) setViewIndex(null) else setViewIndex(index)`. This keeps "live" as the canonical default; no separate "return to live" button is needed for this MVP.

### 4. `MoveList` gains `selectedIndex: number | null` and `onMoveClick: (index: number) => void`

`selectedIndex` drives highlight (replaces the old `lastMoveIndex` derivation). `onMoveClick` passes the flat 0-based index. Move tokens become `<button>` elements.

App passes `selectedIndex={viewIndex ?? moves.length - 1}` — when live, the last move stays highlighted; when reviewing, the clicked move is highlighted.

**Alt: pass move pairs + two-level indices** — adds complexity (pairIndex + side) for no benefit; a flat index maps directly to `moves[index]`.

## Risks / Trade-offs

- **`viewIndex` staleness** — if moves were ever undone, a stale `viewIndex` could point out of bounds. There is no undo feature, so this is not a current concern.
- **No "back to live" affordance** — users must click the last move to exit review mode. Acceptable for MVP; a dedicated button could be added later.
