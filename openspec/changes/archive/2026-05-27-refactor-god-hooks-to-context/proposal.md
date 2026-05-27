## Why

`useGamesPage` (27 return values) and `useBrowsePage` (17 return values) are god hooks: single aggregators that every child component on their page depends on. This creates invisible coupling, opaque API surfaces (`...board` spread), and re-render cascades where fast-changing chess state forces re-renders on slow-changing UI sections (games list, analysis panel) that don't need to update.

## What Changes

- **BREAKING**: `useGamesPage` dissolved — logic redistributes into `GamePageProvider` and section-level hooks
- **BREAKING**: `useGameBoard` dissolved — logic moves into `GamePageProvider`
- **BREAKING**: `useBrowsePage` dissolved — logic redistributes into `BrowsePageProvider` and section-level hooks
- New `GamePageContext` + `GamePageProvider` holding cross-cutting games state (selection, analysis, opening match)
- New `BrowsePageContext` + `BrowsePageProvider` holding cross-cutting browse state (selection, openings, shapes)
- `GamesListPageInner` replaced by four self-contained smart containers: `GamesListSection`, `GamesBoardSection`, `GamesMoveSection`, `GamesAnalysisSection`
- `BrowsePageInner` replaced by four self-contained smart containers: `BrowseOpeningsSection`, `BrowseBoardSection`, `BrowseMoveSection`, `BrowseNotesSection`
- Page components become layout skeletons with zero state and zero props passed to children

## Capabilities

### New Capabilities

- `games-page-context`: React context providing cross-cutting games page state (selected game, analysis, opening match, criticalMoveIndices) to section components without prop drilling
- `browse-page-context`: React context providing cross-cutting browse page state (selected opening, candidate moves, shapes, search) to section components without prop drilling

### Modified Capabilities

- `games-page`: Component structure changes — same user-visible behavior, different internal wiring. Section components replace monolithic inner component.
- `opening-browse`: Component structure changes — same user-visible behavior, different internal wiring. Section components replace monolithic inner component.

## Impact

- `frontend/src/app/routes/_auth/games/list.tsx` — rewritten
- `frontend/src/features/games/hooks/useGamesPage.ts` — deleted
- `frontend/src/features/games/hooks/useGameBoard.ts` — deleted
- `frontend/src/features/games/` — new `GamePageContext.tsx` + section components
- `frontend/src/app/routes/openings/browse.tsx` — rewritten
- `frontend/src/features/openings/components/BrowseTab/useBrowsePage.ts` — deleted
- `frontend/src/features/openings/components/BrowseTab/` — new `BrowsePageContext.tsx` + section components
- No backend changes. No API changes. No routing changes.
