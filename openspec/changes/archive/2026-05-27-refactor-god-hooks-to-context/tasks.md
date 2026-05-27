## 1. Games Page — Context Provider

- [ ] 1.1 Create `frontend/src/features/games/context/GamePageContext.tsx` with `GamePageContext`, `GamePageProvider`, and `useGamePageContext` hook (throws outside provider)
- [ ] 1.2 Move `useGameBoard` logic into `GamePageProvider`: game selection state, orientation state, `useChessGame`, `useGameAnalysis`, `useOpenings`, derived values (`openingMatch`, `criticalMoveIndices`, `moveClassifications`)
- [ ] 1.3 Move URL sync effect (auto-select game from `gameId` param) into `GamePageProvider`
- [ ] 1.4 Memoize context value with `useMemo`; stabilize all callbacks with `useCallback`
- [ ] 1.5 Add `GamePageProvider` to `GamesListPage` wrapping the layout, inside `ChessStoreProvider`

## 2. Games Page — Section Components

- [ ] 2.1 Create `GamesListSection`: calls `useGames`, `useGamesSync`, `useProfile`, `useSearch` directly; reads `selectGame` and `selectedGame` from context; renders `GamesList`
- [ ] 2.2 Create `GamesBoardSection`: calls `useChessGame` directly; manages orientation locally (set from context `selectedGame.user_color` on game change); renders `BoardPanel`
- [ ] 2.3 Create `GamesMoveSection`: reads `history`, `currentMoveIndex`, `navigateToIndex` from chess store directly; reads `moveClassifications`, `criticalMoveIndices`, `openingMoveCount` from context; owns local `showCriticalOnly` state; renders `PanelSection` + `MoveList`
- [ ] 2.4 Create `GamesAnalysisSection`: reads all data from context (`selectedGame`, `analysis`, `criticalMoveIndices`, `openingMatch`); reads `analyze`, `analyzeStatus`, `analyzeProgress` from context; calls `useChessStore(s => s.navigateToIndex)` directly; renders `PanelSection` + `AnalysisHeader` + `AnalysisPanel`

## 3. Games Page — Wire Up and Clean Up

- [ ] 3.1 Rewrite `GamesListPageInner` to be a zero-state layout skeleton rendering the four section components
- [ ] 3.2 Delete `frontend/src/features/games/hooks/useGamesPage.ts`
- [ ] 3.3 Delete `frontend/src/features/games/hooks/useGameBoard.ts`
- [ ] 3.4 Verify games page: game selection, filter changes, arrow key navigation, analysis, move classifications all work correctly

## 4. Browse Page — Context Provider

- [ ] 4.1 Create `frontend/src/features/openings/components/BrowseTab/BrowsePageContext.tsx` with `BrowsePageContext`, `BrowsePageProvider`, and `useBrowsePageContext` hook (throws outside provider)
- [ ] 4.2 Move `useBrowsePage` logic into `BrowsePageProvider`: `useOpenings`, `useBrowseOpeningContext`, search state, orientation state, `useChessGame` (for `loadMoves`, `currentMoves`, `boardFen`), derived values (`displayedOpenings`, `shapes`, `openingMoveIndex`), `selectOpening` action, URL sync effect
- [ ] 4.3 Memoize context value with `useMemo`; stabilize all callbacks with `useCallback`
- [ ] 4.4 Add `BrowsePageProvider` to `BrowsePage` wrapping the layout, inside `ChessStoreProvider`

## 5. Browse Page — Section Components

- [ ] 5.1 Create `BrowseOpeningsSection`: reads `openings`, `isLoading`, `selected`, `exactMatch`, `search`, `setSearch`, `selectOpening` from context; renders `OpeningsList` and `AddToDrillButton`
- [ ] 5.2 Create `BrowseBoardSection`: calls `useChessGame` directly for config; reads `shapes` from context; manages orientation locally (updated via context `selectOpening`); renders `BoardPanel`
- [ ] 5.3 Create `BrowseMoveSection`: reads `history` and `currentMoveIndex` from chess store directly; reads `candidateMoves` from context; calls `useChessStore(s => s.navigateToIndex)` and `useChessStore(s => s.reset)` directly; renders `PanelSection` + `MoveList` + `ContinuationsList`
- [ ] 5.4 Create `BrowseNotesSection`: reads `selected`, `openingMoveIndex` from context; reads current FEN from chess store; renders `PanelSection` + `NotesPanel` (or empty state)

## 6. Browse Page — Wire Up and Clean Up

- [ ] 6.1 Rewrite `BrowsePageInner` to be a zero-state layout skeleton rendering the four section components
- [ ] 6.2 Delete `frontend/src/features/openings/components/BrowseTab/useBrowsePage.ts`
- [ ] 6.3 Verify browse page: opening selection, URL openingId auto-load, arrow key navigation, continuations, notes, add-to-drill all work correctly
