## Context

Both `GamesListPage` and `BrowsePage` follow the same anti-pattern: a single aggregator hook (`useGamesPage` / `useBrowsePage`) owns all page state and returns 17–27 values. The page inner component destructures everything and passes it as explicit props to 4–6 direct child components.

Current data flow:

```
useGamesPage (27 values, includes ...board spread)
  └── GamesListPageInner
       ├── GamesList         (11 props)
       ├── BoardPanel        (4 props)
       ├── MoveList          (8 props)
       └── AnalysisPanel     (5 props)
```

State changes at three frequencies:
- **Fast**: `currentMoveIndex`, `config`, `boardFen` — changes on every arrow key press
- **Slow**: `selectedGame`, `analysis`, `criticalMoveIndices`, `openingMatch` — changes on game selection or analysis completion
- **Very slow**: `games`, `filters`, `syncStatus` — changes on server fetch or user filter interaction

Currently all three frequencies share one re-render boundary. Arrow key navigation forces `GamesList` and `AnalysisPanel` to re-evaluate even though their data didn't change.

## Goals / Non-Goals

**Goals:**
- Each component depends on at most one focused data source
- Fast-changing chess state (arrow key navigation) does not trigger re-renders in slow sections
- `useGamesPage` and `useGameBoard` dissolve; `useBrowsePage` dissolves
- `...board` opaque spread eliminated
- Same user-visible behavior preserved exactly

**Non-Goals:**
- Performance profiling or optimization beyond eliminating unnecessary re-renders
- Changing child component APIs (`GamesList`, `BoardPanel`, `MoveList`, `AnalysisPanel`, etc.)
- Adding new features to either page
- Backend changes

## Decisions

### Decision: React Context over Zustand for page-scoped state

**Chosen**: React Context (`GamePageContext`, `BrowsePageContext`) scoped to the page subtree.

**Alternatives considered**:
- **Zustand page store**: More granular subscriptions but requires manual store lifecycle (create on mount, destroy on unmount). Page-scoped Zustand stores need a factory pattern which adds complexity. Context is simpler for state that lives exactly as long as the page.
- **Keep prop drilling, add React.memo**: Shallow equality checks on the inner component would still fire on every key press because `config` (an object) changes. `useMemo` on config is already in `useChessGame`. Doesn't solve the structural coupling.
- **Compound component / render props**: More flexible but no benefit here — layout is fixed.

**Why Context wins**: State lifetime matches exactly the page component tree. No lifecycle management needed. `useContext` gives components opt-in subscription — components only re-render when their consumed context slice changes (if we split contexts correctly).

### Decision: Two-context split per page

Each page gets two contexts, not one:
1. **Chess context** (fast): handled by the existing `ChessStoreProvider` (Zustand). Components call `useChessStore(selector)` directly for `currentMoveIndex`, `history`, `navigateToIndex`.
2. **Page context** (slow): new `GamePageContext` / `BrowsePageContext`. Holds cross-cutting state that multiple sections need but that only changes on user selection events.

Putting everything in one context would mean any fast-path chess change re-renders all context consumers. The split keeps the fast path isolated to Zustand.

### Decision: Smart container sections, not dumb sections with prop injection

Each page section (`GamesListSection`, `GamesBoardSection`, etc.) is a self-contained smart container that owns its hooks. The page layout component is a pure skeleton with zero state.

**Why**: Aligns with CLAUDE.md principle — extract logic into custom hooks and co-locate with the component. Section components become independently testable. The page layout becomes readable at a glance: structure only, no logic.

### Decision: `useGameBoard` logic moves into `GamePageProvider`, not into sections

`useGameBoard` bundles: game selection state, orientation state, `useChessGame`, `useGameAnalysis`, `useOpenings`, derived values (openingMatch, criticalMoveIndices, moveClassifications). This coordination logic must live somewhere shared because:
- `selectGame` loads PGN into chess store AND sets `selectedGame` state
- `useGameAnalysis` reads `allFens`/`allMoves` from chess store
- `criticalMoveIndices` and `moveClassifications` are needed by two different sections

Moving it into `GamePageProvider` keeps it co-located with the context that exposes it, and out of the page layout component.

### Decision: URL sync stays in page-level initialization, not in context provider

The `useEffect` that reads `gameId`/`openingId` from URL and auto-selects a game/opening stays as a thin initialization hook called directly in the layout component (or in the Provider). It should not live in a section component because URL sync is page-scoped, not section-scoped.

## Risks / Trade-offs

**[Risk]: Context value reference instability causing unnecessary re-renders**
If `GamePageContext` value object is re-created on every render (e.g., inline `value={{ selectedGame, analyze }}`), all consumers re-render even when values didn't change.
→ Mitigation: memoize the context value with `useMemo`. Stabilize callbacks with `useCallback`.

**[Risk]: Drilling `onMoveClick` from chess store into `AnalysisPanel` via context**
`onMoveClick` is `navigateToIndex` from the chess store. Putting it in `GamePageContext` couples the analysis context to chess navigation.
→ Mitigation: `GamesAnalysisSection` calls `useChessStore(s => s.navigateToIndex)` directly rather than getting it from context.

**[Risk]: `useGameAnalysis` depends on `allFens`/`allMoves` which come from chess store**
The analysis hook needs chess history. If it lives in `GamePageProvider`, the provider must also subscribe to chess store state.
→ Mitigation: `GamePageProvider` subscribes to chess store for `allFens`/`allMoves` via `useChessStore`. This is fine — the provider is inside `ChessStoreProvider` and this subscription is stable (only changes when a new game loads, not on navigation).

**[Trade-off]: More files, more indirection**
Replacing one god hook with a context provider + 4 section components adds file count. The coupling is now implicit (via context) rather than explicit (via props).
→ Accepted: explicit prop drilling at 27 values is worse than context. The architecture becomes predictable: layout components are skeletons, section components are self-contained.

## Migration Plan

1. Games page first (more complex, validates the pattern)
2. Browse page second (simpler, apply same pattern)
3. Delete dead files (`useGamesPage.ts`, `useGameBoard.ts`, `useBrowsePage.ts`) after both pages work
4. No feature flags needed — this is a pure internal refactor with identical user-visible behavior
5. Rollback: git revert. No data migrations, no API changes.

## Open Questions

- None. The pattern is established; implementation can proceed.
