## Context

Current board stack: `react-chessboard` renders via React, delegates drag to dnd-kit. dnd-kit loses track of drag state on window blur → ghost piece stuck at source square. Workaround: force-remount `<Chessboard key={boardKey}>` on `blur`/`visibilitychange`. This is observable jank and will recur on any focus-loss event.

`@lichess-org/chessground` is imperative: `Chessground(el, config): Api`. No React bindings ship with it — you mount once, then call `api.set(partialConfig)` to update. Native drag handles its own pointer events, no dnd-kit involved.

Current public API of `<ChessBoard>`:

```ts
type ChessBoardProps = {
  position?: string          // FEN
  orientation?: 'white' | 'black'
  boardWidth?: number
  interactive?: boolean
  animationDurationInMs?: number
  onMove?: (move: MoveResult) => void
  onGameOver?: (result: GameOverResult) => void
}
```

This API stays unchanged — callers (`routes/index.tsx`) need no edits.

## Goals / Non-Goals

**Goals:**
- Eliminate ghost-piece bug permanently via native drag
- Keep `ChessBoardProps` identical (no breaking change to callers)
- Support: move by drag, move by click-click, legal move highlighting, board orientation, FEN-driven position, animation
- Match current visual fidelity (piece set, board theme)

**Non-Goals:**
- Premoves (future feature)
- Arrows / drawable shapes (future feature, but chessground supports it)
- Promotion UI (chessground doesn't include one; promotion dialog is already caller-side responsibility — keep as-is)
- Any backend changes

## Decisions

### 1. Custom React wrapper, not `react-chessground`

`react-chessground` (ruilisi) wraps chessground v7, is unmaintained since ~2020, and has no TypeScript types. A custom wrapper is ~50 lines and gives full control over config updates.

Pattern:
```tsx
// mount once
useEffect(() => {
  api.current = Chessground(ref.current, initialConfig)
  return () => api.current?.destroy()
}, [])

// update on config change — stable object reference via useMemo
useEffect(() => {
  api.current?.set(config)
}, [config])
```

### 2. `useChessGame` drives config, not callbacks

chessground config is a single object passed to `api.set()`. `useChessGame` builds and returns the full `Config` object (including `movable.dests`, `movable.after`, `highlight`, `events`). `ChessBoard` passes this to the wrapper — no callback threading needed.

```ts
// useChessGame returns:
{
  fen: string
  config: Config   // chessground Config
  // ... nothing else needed
}
```

### 3. Legal moves via `movable.dests`

chess.js computes legal moves; we convert to chessground's `Map<Key, Key[]>` format:

```ts
function toDests(chess: Chess): Map<Key, Key[]> {
  const map = new Map<Key, Key[]>()
  for (const move of chess.moves({ verbose: true })) {
    const srcs = map.get(move.from as Key) ?? []
    srcs.push(move.to as Key)
    map.set(move.from as Key, srcs)
  }
  return map
}
```

When `interactive = false`, pass `movable: { color: undefined }` to disable all interaction.

### 4. CSS assets via direct imports

chessground ships CSS in the package. Import in `src/index.css` (or entry TS file):

```css
@import "@lichess-org/chessground/assets/chessground.base.css";
@import "@lichess-org/chessground/assets/chessground.brown.css";
@import "@lichess-org/chessground/assets/chessground.cburnett.css";
```

Piece set `cburnett` matches current react-chessboard default. Can swap later.

### 5. `MoveResult` / `GameOverResult` types stay

These types are re-exported from `ChessBoard` and used by callers. Keep them; just decouple from react-chessboard internals.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| chessground config object rebuilds every render, causing `api.set()` loops | Memoize config with `useMemo`; deps are primitives (fen string, interactive bool, orientation string) |
| Piece animation differs from current behavior | chessground has built-in animation; `animationDurationInMs` maps to `animation.duration` in config |
| Square highlight API different from `squareStyles` | Use `highlight.customSquares` for last-move/check; `selected` field for selected square |
| GPL-3.0 license | Project stays open source — already the case |
| Promotion: chessground fires `movable.after` with promotion piece as 4th arg when applicable | Handle in `useChessGame` same as current logic |

## Migration Plan

1. Install `@lichess-org/chessground`, remove `react-chessboard`
2. Add CSS imports
3. Write `ChessGround.tsx` wrapper
4. Rewrite `useChessGame.ts` (chessground config output instead of react-chessboard handlers)
5. Rewrite `ChessBoard.tsx` to use new wrapper + hook
6. Remove `boardKey` remount hack
7. Manual smoke test: drag, click-click, board flip, non-interactive mode (review), PGN import navigation
8. Commit

No rollback needed — this is a contained component swap with identical public API.

## Open Questions

- Promotion dialog: does current code handle promotion already? If not, chessground fires `movable.after(orig, dest, metadata)` where `metadata.captured` etc. available — check if queen-auto-promote is acceptable for now.
