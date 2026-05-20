## Context

`ChessBoard.tsx` is 243 lines where the JSX render is 6 lines. The remaining 237 lines are six mixed concerns: game state, latest-ref boilerplate, responsive sizing, two deeply-nested handlers with duplicated logic, hint-style derivation, and the render itself. `handlePieceDrop` and `handleSquareClick` each contain identical blocks for promotion detection, move execution, and game-over checking.

## Goals / Non-Goals

**Goals:**
- Eliminate duplicated move-execution + game-over logic via a shared `executeMove` helper
- Extract `useChessGame` hook: owns Chess instance, `selectedSquare`, `hoveredSquare`, latest-ref pattern, all event handlers, hint-style derivation
- Extract `useBoardSizing` hook: owns `containerRef`, `ResizeObserver`, `containerWidth`
- `ChessBoard` becomes a ~30-line wiring layer
- Zero behavior change; public props API and exported types unchanged

**Non-Goals:**
- Moving files out of `src/components/ChessBoard/` (co-location is the right call here)
- Changing how `ChessBoard` is consumed by `App.tsx` or any future consumer
- Extracting types to a separate file

## Decisions

### File layout: co-locate inside `src/components/ChessBoard/`

```
src/components/ChessBoard/
  ChessBoard.tsx        ← wiring layer, re-exports types
  useChessGame.ts       ← chess state + handlers
  useBoardSizing.ts     ← ResizeObserver + containerWidth
  index.ts              ← re-exports ChessBoard, MoveResult, GameOverResult
```

Alternatives considered:
- `src/hooks/useChessGame.ts` — wrong; it's tightly coupled to ChessBoard internals, not a general hook
- `src/features/game/` — premature; no feature folder exists yet

### `executeMove`: module-level function, not exported

Takes the current `Chess` instance FEN, `from`, `to`, `promotion` flag. Returns `{ game: Chess, move } | null`. Callers (`handlePieceDrop`, `handleSquareClick`) call it and then fire the `onMoveRef` / `onGameOverRef` callbacks. The callbacks stay outside `executeMove` to keep the helper pure (no side effects).

Alternatives considered:
- Include callback calls inside `executeMove` — would require passing refs in, coupling helper to hook internals
- Inline in each handler (status quo) — the duplication we're fixing

### `useChessGame` return shape: flat object

```ts
{
  game,
  squareStyles,
  handlePieceDrop,
  handleSquareClick,
  handleMouseOverSquare,
  handleMouseOutSquare,
}
```

`ChessBoard` doesn't need `selectedSquare` or `hoveredSquare` directly — it only needs the derived `squareStyles`. Those stay internal to the hook.

### `useBoardSizing` return shape

```ts
{ containerRef, width }
```

`width` is `boardWidth ?? containerWidth` — the resolved value. Caller doesn't need to know about `containerWidth` or the fallback logic.

## Risks / Trade-offs

- Pure structural refactor — behavioral risk is near zero; TypeScript compilation is the safety net
- `executeMove` is not exported; if future callers need it they can import from `useChessGame.ts` directly
