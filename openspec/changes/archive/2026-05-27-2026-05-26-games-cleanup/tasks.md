## 1. Extract game formatters

- [ ] 1.1 Create `frontend/src/features/games/utils/gameFormatters.ts`:
  - `formatDate(iso: string | null): string` — moved from `GamesList.tsx`
  - `timeControlLabel(tc: string | null): string` — moved from `GamesList.tsx`; fix: when `isNaN(secs)` return `''` not `tc` (consistent null-like fallback)
- [ ] 1.2 In `GamesList.tsx`: remove local `formatDate` and `timeControlLabel`; import from utils
- [ ] 1.3 Run `tsc --noEmit` — zero errors

## 2. Extract opening move count logic

- [ ] 2.1 Create `frontend/src/features/games/utils/gameLogic.ts`:
  - `computeOpeningMoveCount(gameMoves: string[], gameEco: string | null, openings: Opening[]): number`
  - Pure function: finds the longest matching opening move prefix for games with the same ECO code
- [ ] 2.2 In `useGamesTab`: replace inline `useMemo` body with call to `computeOpeningMoveCount`
- [ ] 2.3 Fix `openingMoveCount` deps: change `[selectedGame, openings]` to `[selectedGame?.eco, selectedGame?.moves, openings]`
- [ ] 2.4 Run `tsc --noEmit` — zero errors

## 3. Fix sync invalidation bug

- [ ] 3.1 In `useGamesSync.startPolling`, replace:
  ```ts
  qc.invalidateQueries({ queryKey: gamesKeys.list({ result: null, ... }) })
  ```
  with:
  ```ts
  qc.invalidateQueries({ queryKey: ['games-list'] })
  ```
  This invalidates all games-list queries regardless of active filters.

## 4. Extract useGameBoard

- [ ] 4.1 Create `frontend/src/features/games/hooks/useGameBoard.ts`:
  - Accepts no params; owns `useState` for `orientation` and `selectedGame`
  - Calls `useChessGame({ interactiveAtEnd: false, orientation })`
  - Calls `useGameAnalysis(gameHistory.allFens, selectedGame?.id ?? null, 18, onAnalysisComplete)`
  - Calls `useOpenings()` for opening move count
  - Computes `openingMoveCount` and `moveClassifications`
  - Exposes `selectGame(game)`, `flipOrientation()`, board config, moves, analysis state
  - Accepts `onAnalysisComplete: () => void` as param (so caller can invalidate queries)
- [ ] 4.2 In `useGamesTab`: remove board/analysis/opening concerns; call `useGameBoard(onAnalysisComplete)`; keep profile + filters + games + sync only
- [ ] 4.3 Run `tsc --noEmit` — zero errors

## 5. Dissolve useGamesList

- [ ] 5.1 Inline `filters` useState and setters directly into `useGamesTab` (replacing `useGamesList()` call)
- [ ] 5.2 Delete `frontend/src/features/games/components/GamesList/useGamesList.ts`
- [ ] 5.3 Confirm no other file imports `useGamesList`: `grep -r "useGamesList" src/`

## 6. Write tests

- [ ] 6.1 Create `frontend/src/features/games/__tests__/gameFormatters.test.ts`:
  - `formatDate(null)` → `''`
  - `formatDate('2024-01-15T10:00:00Z')` → contains 'Jan' and '2024'
  - `timeControlLabel(null)` → `''`
  - `timeControlLabel('60+0')` → `'⚡'` (bullet, 60s)
  - `timeControlLabel('179+0')` → `'⚡'` (bullet boundary)
  - `timeControlLabel('300+5')` → `'⏱'` (blitz, 300s)
  - `timeControlLabel('600+0')` → `''` (rapid, not labeled)
  - `timeControlLabel('1/259200')` → `''` (daily, non-numeric → fixed NaN path)
- [ ] 6.2 Create `frontend/src/features/games/__tests__/gameLogic.test.ts`:
  - `computeOpeningMoveCount([], null, openings)` → 0
  - `computeOpeningMoveCount(moves, 'B20', [])` → 0
  - ECO mismatch → 0
  - Matching opening, all moves match → opening.moves.length
  - Two openings same ECO, different length → returns longest matching
  - Moves diverge at index 2 → 0 (no partial credit)

## 7. Verification

- [ ] 7.1 Run `vitest run` — all tests pass
- [ ] 7.2 Run `tsc --noEmit` — zero errors
- [ ] 7.3 Manual smoke test: games list loads, filters work, sync button triggers and progress shows, games-list refreshes after sync completes
- [ ] 7.4 Manual smoke test: select a game → board loads, analysis runs, opening moves highlighted in move list
- [ ] 7.5 Confirm `useGamesList.ts` no longer exists
