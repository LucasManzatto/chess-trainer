## Context

Three violations of the project's React Philosophies guidelines were found during code review:

1. **`ChessBoard.handlePieceDrop`**: `useCallback` with `[game, onMove, onGameOver]` deps. `game` is a `Chess` instance — a new object reference on every move. This recreates the callback after every piece drop, defeating the purpose of `useCallback` and causing `react-chessboard` to receive a new `onPieceDrop` reference on every render.

2. **`MoveList.moves` prop type**: `MoveResult[]` — but `MoveList` only reads `.san`. Passing the full object couples `MoveList` to `ChessBoard`'s type and violates "pass primitives not objects."

3. **`MoveList` pair-building loop**: `for` loop with imperative `push` where a declarative higher-order function is preferred per project guidelines.

## Goals / Non-Goals

**Goals:**
- Stable `handlePieceDrop` callback with `[]` deps via the latest ref pattern
- `MoveList` accepts `string[]`, decoupled from `MoveResult`
- Declarative `Array.from` replaces the `for` loop in `MoveList`
- Zero behavior change — same visible output and game logic

**Non-Goals:**
- Performance profiling or benchmarking (changes are correctness/style fixes)
- Changing `ChessBoard`'s external API (`position`, `onMove`, `onGameOver` props unchanged)
- Memoizing `MoveList` with `React.memo` (not proven necessary yet)

## Decisions

### 1. Latest ref pattern for `handlePieceDrop`

Store `game`, `onMove`, and `onGameOver` in refs that are updated on every render. The callback reads from the refs instead of closing over the values directly, so it can have `[]` dependencies.

```tsx
const gameRef = useRef(game)
gameRef.current = game          // always fresh, no dep needed

const onMoveRef = useRef(onMove)
onMoveRef.current = onMove

const onGameOverRef = useRef(onGameOver)
onGameOverRef.current = onGameOver

const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
  const gameCopy = new Chess(gameRef.current.fen())
  // ...use onMoveRef.current, onGameOverRef.current
}, [])  // stable forever
```

**Alternative considered**: Keep deps as-is. Rejected — callback recreates on every move, flagged by guidelines as the class of problem `useCallback` is meant to solve.

**Alternative considered**: Wrap `onMove`/`onGameOver` in `useCallback` at the call site (App.tsx). Rejected — pushes burden to callers; the component should handle its own stability.

### 2. `MoveList` accepts `string[]`

`MoveList` is a pure display component. It renders SAN tokens. It has no reason to know about `from`, `to`, `fen`, or `promotion`. App.tsx extracts SANs before passing: `moves.map(m => m.san)`.

**Alternative considered**: `Pick<MoveResult, 'san'>[]`. Rejected — still an object, still couples to `MoveResult`. A plain `string[]` is the correct primitive-first choice.

### 3. `Array.from` for pair building

```tsx
const pairs = Array.from(
  { length: Math.ceil(moves.length / 2) },
  (_, i) => [moves[i * 2], moves[i * 2 + 1]] as [string, string | undefined]
)
```

Same semantics, declarative, consistent with the guidelines preference for higher-order functions.

## Risks / Trade-offs

- Latest ref pattern: refs are read inside an async-like callback. React guarantees ref mutations are synchronous and visible before the callback fires — this is safe. [EpicReact: The Latest Ref Pattern](https://epicreact.dev/the-latest-ref-pattern-in-react)
- `MoveList` prop change is **breaking** for any future callers — documented in proposal. Only one call site exists today (App.tsx).
