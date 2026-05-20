## Context

`react-chessboard` ships with `showAnimations: true` and `animationDurationInMs: 300` as defaults. Its internal `getPositionUpdates` utility diffs two position objects and computes per-piece from→to movements; all matched pieces animate simultaneously via CSS `transform: translate` transitions. Unmatched pieces (where the heuristic fails) snap. The current `ChessBoard` component does not explicitly set these options.

History navigation is already implemented (move-history-navigation change): clicking a move in `MoveList` updates `viewIndex` in `App.tsx`, which changes the `position` prop to `ChessBoard`, which loads the new FEN into `chess.js` and re-renders with the new `game.fen()`. This triggers react-chessboard's position-diff animation pipeline.

Keyboard navigation does not exist yet — only click navigation.

## Goals / Non-Goals

**Goals:**
- Ensure piece-movement animations fire on every history position change
- Add ← → keyboard navigation for one-step-at-a-time history traversal (animation works best here — exactly one piece moves)
- Expose `animationDurationInMs` as a `ChessBoard` prop so callers can tune it per context

**Non-Goals:**
- Replay/autoplay mode (not requested)
- Animating captures' disappearance (react-chessboard limitation — out of scope)
- Custom animation easing curves

## Decisions

**1. Explicitly pass `showAnimations` and `animationDurationInMs` to `<Chessboard>`**

The defaults are correct but implicit. Making them explicit in `ChessBoard` options documents the intent and lets the prop flow through.

**2. Expose `animationDurationInMs` as a `ChessBoardProps` prop (default 300)**

History navigation and live play may want different durations. Callers can pass a different value without touching the component internals. Alternative: hardcode — rejected because it forces a code change to tune.

**3. Keyboard navigation in `App.tsx` via `window.addEventListener('keydown')`**

`App.tsx` owns `viewIndex`, so it's the right place for the handler. Attaching to `window` means the shortcut works regardless of which element has focus, matching standard chess app UX.

- ← (ArrowLeft): decrement `viewIndex` (or go to `moves.length - 2` when in live mode, stepping back from the last move)
- → (ArrowRight): increment `viewIndex`; when reaching `moves.length - 1`, clear to `null` (live mode)
- `Escape`: clear to `null` (live mode)

**4. Clamp navigation index to `[0, moves.length - 1]`**

Prevents underflow/overflow. No wrapping — at the start, ← is a no-op; at the end, → returns to live.

**5. No change to MoveList for keyboard nav**

MoveList already highlights `selectedIndex`; keyboard nav updates `viewIndex` in `App`, which flows to `selectedIndex`. No additional MoveList changes needed.

## Risks / Trade-offs

- [Multi-step jump animation quality] → react-chessboard's heuristic may mis-assign identical piece types (e.g., two white rooks) on large jumps, causing some pieces to animate to wrong intermediate squares before snapping. Mitigation: keyboard nav (one step at a time) is the recommended interaction for smooth animation; click-to-jump is still supported but with potentially imperfect animations.
- [keydown on window conflicts with future global shortcuts] → Mitigation: clean up the listener in `useEffect` return; document the handler clearly.
