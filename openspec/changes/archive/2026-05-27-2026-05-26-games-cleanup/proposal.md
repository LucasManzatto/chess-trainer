## Why

The games feature has the same category of issues found and fixed in the openings feature, plus one bug:

1. **DRY/testability — pure functions buried in components and hooks.** `formatDate`, `timeControlLabel` (in `GamesList.tsx`), and `openingMoveCount` logic (in `useGamesTab`) are untested private functions. `timeControlLabel` has an inconsistent null/NaN return path.

2. **React philosophy — whole-object `useMemo` dependency.** `openingMoveCount` depends on `selectedGame` (full `Game` object) when it only uses `selectedGame.eco` and `selectedGame.moves`. Any field change on the selected game triggers an unnecessary linear scan over all openings.

3. **Bug — `useGamesSync` invalidates only the default-filter query.** After sync completes, `gamesKeys.list({ result: null, color: null, time_class: null, eco: '' })` is invalidated — but if the user has active filters, their view never refreshes.

4. **SRP — `useGamesTab` has 7 responsibilities.** Profile, filters, games list, sync, board, analysis, and opening detection all live in one 90-line hook. Splitting board + analysis into `useGameBoard` makes each hook independently readable.

5. **`useGamesList` is a thin useState wrapper** with no logic that can't live directly in `useGamesTab`. Same pattern dissolved in `useOpeningsList`.

## What Changes

- **New `games/utils/gameFormatters.ts`** — `formatDate(iso)`, `timeControlLabel(tc)` extracted and exported; fix inconsistent NaN return in `timeControlLabel`
- **New `games/utils/gameLogic.ts`** — `computeOpeningMoveCount(gameMoves, gameEco, openings)` extracted and exported
- **`GamesList.tsx`** — import `formatDate`, `timeControlLabel` from utils; remove local definitions
- **`useGamesTab`** — fix `openingMoveCount` deps to use `selectedGame?.eco` + `selectedGame?.moves`; import `computeOpeningMoveCount` from utils
- **`useGamesSync`** — fix invalidation: use `queryKey: gamesKeys.list` prefix instead of hardcoded default-filter key so all filtered views refresh
- **`useGameBoard`** — new hook: owns `useChessGame`, `useGameAnalysis`, `openingMoveCount`, `moveClassifications`, `orientation`, `selectGame`; returns board state
- **`useGamesTab`** — simplified: calls `useGameBoard`; no longer owns board/analysis/opening concerns
- **`useGamesList`** — dissolved; filter state inlined into `useGamesTab`
- **New test files** — `games/__tests__/gameFormatters.test.ts`, `games/__tests__/gameLogic.test.ts`

## Capabilities

### Modified Capabilities

- `games-list`: Internal — formatters extracted. Bug fix: filtered views now refresh after sync.
- `game-analysis`: Internal — `useGamesTab` split, no behavior change.

## Impact

- `frontend/src/features/games/utils/gameFormatters.ts` — new file
- `frontend/src/features/games/utils/gameLogic.ts` — new file
- `frontend/src/features/games/__tests__/gameFormatters.test.ts` — new test file
- `frontend/src/features/games/__tests__/gameLogic.test.ts` — new test file
- `frontend/src/features/games/hooks/useGameBoard.ts` — new hook
- `frontend/src/features/games/components/GamesList/GamesList.tsx` — import formatters from utils
- `frontend/src/features/games/hooks/useGamesTab.ts` — simplified; dissolves `useGamesList`; uses `useGameBoard`
- `frontend/src/features/games/hooks/useGamesSync.ts` — fix query invalidation
- `frontend/src/features/games/components/GamesList/useGamesList.ts` — deleted
- No backend changes
- No new dependencies
- One bug fix (sync invalidation); all other changes are pure refactors
