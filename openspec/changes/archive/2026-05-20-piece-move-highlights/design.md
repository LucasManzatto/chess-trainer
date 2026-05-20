## Context

`ChessBoard` uses `react-chessboard`'s `customSquareStyles` prop to apply per-square CSS. `chess.js` already tracks game state and can return legal moves for any piece. Currently the component handles click-to-move via `onSquareClick` but has no selection state.

## Goals / Non-Goals

**Goals:**
- Show move hints on piece click using existing `chess.js` + `react-chessboard` APIs
- Dot overlay for empty destination squares; filled highlight for capture squares
- Hover fill on any hinted square
- Clear hints on move or deselect click

**Non-Goals:**
- Animated transitions or multi-step hint sequences
- Hint persistence across unmounts or in Zustand
- Backend involvement

## Decisions

**1. Local `useState` for selected square, not Zustand**

Hint state is purely ephemeral UI — lives and dies within one interaction. Zustand is for shared/persisted client state. `useState` is simpler and co-located.

**2. Derive hint squares in render, not a separate state slice**

`chess.js` `moves({ square, verbose: true })` is O(legal-moves) — cheap. Compute on each render from `selectedSquare` + `game` rather than storing a `hintSquares` array in state. Avoids sync bugs.

**3. `customSquareStyles` for overlays, not DOM portals or canvas**

`react-chessboard` exposes `customSquareStyles` (record of square → CSSProperties). This is the documented extension point — no hacks needed. Dot is a pseudo-element via `::after` but CSSProperties doesn't support pseudo-elements, so use inline `background` with `radial-gradient` for the dot, and a solid `rgba` background for captures.

**4. Hover via React `onMouseEnter`/`onMouseLeave` on `customSquareRenderer`**

`react-chessboard` also accepts a `customSquareRenderer` component. Use it to attach hover state (`useState<string | null>`) at the board level, track `hoveredSquare`, then merge hover style into `customSquareStyles` for the hinted square. Avoids CSS `:hover` fighting with `customSquareStyles` inline styles.

**5. Click-to-move flow unchanged**

Existing `onSquareClick` handler: if a square is selected and the click is a legal destination, make the move (clears selection). If click is on own piece, select it (replace selection). If click is on empty non-hint square, deselect.

## Risks / Trade-offs

- `radial-gradient` dot on `background` image — if `react-chessboard` also sets `background` on the square div, styles may conflict → Mitigation: test with current board theme; use `customSquareRenderer` wrapper div instead if needed.
- `customSquareRenderer` re-renders all 64 squares on hover change → acceptable; 64 cheap divs, no profiler evidence of slowness needed yet (CLAUDE.md: prove slowness before optimizing).
