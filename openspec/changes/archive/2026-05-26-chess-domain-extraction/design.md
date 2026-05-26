## Context

Chess domain logic is currently split across three files inside `components/ChessBoard/`:
- `stores/chessStore.ts` — Zustand store that mixes chess operations (move application, history building, navigation) with Zustand `set`/`get` plumbing
- `hooks/useChessGame.ts` — React hook that mixes chess logic (legal move computation, PGN parsing, threat detection) with React hooks
- `utils/index.ts` — contains `computeThreats` and `computeCandidateShapes` (already pure functions, but misplaced in a UI utils file)

Testing any chess operation requires instantiating a Zustand store or rendering a React component. There is no layer that can be imported and called as plain functions.

## Goals / Non-Goals

**Goals:**
- Create `frontend/src/chess/` — a pure TypeScript module with zero React/Zustand imports
- All chess domain operations become plain functions: input → output, no side effects
- Unit tests for chess domain run with plain Vitest (no DOM, no React test utils)
- Zustand store and React hook become thin shells — their chess logic is fully delegated
- Zero behavior change for all existing features

**Non-Goals:**
- Moving any logic to the backend
- Extracting into a separate workspace package or npm package
- Changing public APIs of hooks or store actions
- Adding new chess features

## Decisions

### 1. `chess/` as a folder inside `frontend/src/`, not a workspace package

**Decision:** `frontend/src/chess/`

**Rationale:** A workspace package adds monorepo tooling, build steps, and version management for zero practical benefit at this scale. A folder inside `src/` is immediately importable, co-located with its consumers, and needs no configuration changes. If a second client (mobile, CLI) ever needs this logic, extraction to a package is a one-step refactor.

**Alternative rejected:** `packages/chess-domain/` workspace package — over-engineered for a single-client app.

---

### 2. Remove `chessEngine: Chess` from Zustand state

**Decision:** Drop `chessEngine` from the store. When the current engine is needed (e.g., for `applyMove`), reconstruct it inline: `new Chess(currentFen)`.

**Rationale:** Storing a mutable chess.js `Chess` instance in Zustand is problematic:
- Zustand assumes state is plain serialisable data; a class instance with internal mutable state violates this
- It causes subtle bugs when Zustand's shallow-equality checks fail to detect internal mutations
- The engine is always fully reconstructible from the current FEN in history — it carries no information that isn't already in `history[currentMoveIndex].fen`

**Trade-off:** Reconstructing `new Chess(fen)` on every `applyMove` or navigation adds a small allocation. This is negligible — chess.js construction from FEN is O(64) and sub-millisecond.

**Alternative rejected:** Keep `chessEngine` but wrap in a ref inside the hook — this solves the Zustand mutation issue but still mixes concerns.

---

### 3. `chess/` module file layout

```
frontend/src/chess/
  types.ts      — HistoryEntry, GameMetadata, ThreatSquares (source of truth)
  game.ts       — buildHistoryFromMoves, applyMove, navigateTo, undoLastMove
  pgn.ts        — parsePgn → { moves: string[], metadata: GameMetadata }
  analysis.ts   — computeThreats, computeCandidateShapes
  index.ts      — re-exports everything (single import surface)
```

**Rationale:** One file per concern. `types.ts` is imported by all others and has no chess.js dependency — just TypeScript types. `index.ts` as a barrel lets consumers import from `'@/chess'` without knowing the internal split.

---

### 4. Types migration strategy — re-export for backward compatibility

**Decision:** Move `HistoryEntry`, `ThreatSquares`, `MoveResult`, `GameOverResult`, `EvaluationScore`, `EvaluationResult`, `MoveClassification`, `MoveAnalysis`, `GameAnalysis` to `chess/types.ts`. Keep `components/ChessBoard/types/index.ts` as a re-export barrel.

```typescript
// components/ChessBoard/types/index.ts (after)
export type * from '../../../chess/types'
```

**Rationale:** Avoids a sweeping import refactor across all feature files. Types that are purely UI-concern (`UseChessGameProps`) stay in `components/ChessBoard/types/`.

---

### 5. `chessStore.ts` becomes a thin Zustand shell

After extraction, store state holds only serialisable primitives:

```typescript
interface ChessState {
  history: HistoryEntry[]      // was already here
  currentMoveIndex: number     // was already here
  // chessEngine: Chess ← REMOVED
}
```

Each action delegates to `chess/game.ts`:

```typescript
loadMoves: (moves) => {
  const history = buildHistoryFromMoves(moves)  // chess/game.ts
  set({ history, currentMoveIndex: history.length - 1 })
},

applyMove: (orig, dest) => {
  const { history, currentMoveIndex } = get()
  const currentFen = currentMoveIndex >= 0 ? history[currentMoveIndex].fen : INITIAL_FEN
  const result = applyMoveToPosition(currentFen, history, currentMoveIndex, orig, dest)  // chess/game.ts
  if (!result) return null
  set({ history: result.history, currentMoveIndex: result.newIndex })
  return result.entry
},
```

---

### 6. Test structure

```
frontend/src/chess/__tests__/
  game.test.ts      — buildHistoryFromMoves, applyMove, navigateTo, undoLastMove
  pgn.test.ts       — parsePgn valid/invalid inputs
  analysis.test.ts  — computeThreats scenarios (hanging, pinned)
```

Plain `vitest` — no `@testing-library/react`, no `jsdom` required. Each test imports from `chess/` and calls functions directly.

## Risks / Trade-offs

- **[Risk] Zustand subscribers that read `chessEngine` will break** → Only `useChessGame.ts` reads `chessEngine` from the store; it will be updated as part of this change. Confirm no other consumers via `grep chessEngine`.
- **[Risk] Navigation functions reconstruct Chess from FEN — if FEN in history is wrong, engine is wrong** → The existing `loadMoves` already builds FENs via chess.js replay, so they are always valid. This risk existed before the change.
- **[Trade-off] `computeThreats` and `computeCandidateShapes` move import paths** → Any file importing from `utils/index.ts` for these functions must update to `chess/analysis.ts` (or the barrel `chess/`). Grep-and-replace, low risk.
- **[Trade-off] Type import paths change** → Mitigated by re-export barrel in `components/ChessBoard/types/index.ts`. No consumer import changes needed.

## Migration Plan

This is an in-place refactor with no deployment concerns (frontend only, no API changes).

1. Create `chess/types.ts` — copy types, update re-export barrel in `components/ChessBoard/types/`
2. Create `chess/analysis.ts` — move `computeThreats`, `computeCandidateShapes`; update `utils/index.ts`
3. Create `chess/pgn.ts` — extract `parsePgn` from `useChessGame.ts`
4. Create `chess/game.ts` — extract store operations; add `buildHistoryFromMoves`, `applyMoveToPosition`, navigation helpers
5. Rewrite `chessStore.ts` — delegate to `chess/game.ts`, remove `chessEngine` from state
6. Simplify `useChessGame.ts` — remove chess logic, reconstruct engine inline where needed for config
7. Write unit tests in `chess/__tests__/`
8. Run full TypeScript check + existing tests

Rollback: git revert. No data migrations, no API changes.

## Open Questions

- None — design is fully determined by the constraints above.
