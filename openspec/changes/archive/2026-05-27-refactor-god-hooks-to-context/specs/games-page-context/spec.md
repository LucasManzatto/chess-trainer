## ADDED Requirements

### Requirement: GamePageContext provides cross-cutting games page state
A `GamePageContext` SHALL exist, provided by `GamePageProvider`, that holds state shared across multiple sections of the games list page. The context SHALL expose: `selectedGame` (the currently loaded `Game | null`), `selectGame` (action that loads PGN into chess store and updates URL), `analysis`, `analyzeStatus`, `analyzeProgress`, `analyze`, `moveClassifications`, `criticalMoveIndices`, `openingMatch`, and `openingMoveCount`. Components outside the `GamePageProvider` subtree SHALL NOT access this context.

#### Scenario: Context available to section components
- **WHEN** `GamesListSection`, `GamesMoveSection`, or `GamesAnalysisSection` call `useGamePageContext`
- **THEN** they receive the current context value without any props being passed from the page layout

#### Scenario: Context throws outside provider
- **WHEN** `useGamePageContext` is called outside a `GamePageProvider`
- **THEN** it throws an error indicating the hook was used outside its provider

### Requirement: GamesListPage layout component holds zero state
The `GamesListPage` layout component (inner, after `ChessStoreProvider` and `GamePageProvider`) SHALL render a grid with four section slot components and pass zero props to them. All data flow SHALL happen via context or direct store access inside the section components.

#### Scenario: Page layout renders four sections
- **WHEN** an authenticated user navigates to the games list page
- **THEN** `GamesListSection`, `GamesBoardSection`, `GamesMoveSection`, and `GamesAnalysisSection` all render in the grid layout

### Requirement: GamesListSection is self-contained
`GamesListSection` SHALL call `useGames`, `useGamesSync`, `useProfile`, and `useSearch` directly. It SHALL read `selectGame` from `GamePageContext` and `selectedGame` from context to derive `selectedId`. It SHALL render the `GamesList` component with all required props sourced locally.

#### Scenario: Game selection updates context
- **WHEN** a user clicks a game in `GamesListSection`
- **THEN** `selectGame` from context is called, loading the PGN into the chess store and updating the URL `gameId` param

#### Scenario: Filter changes update URL
- **WHEN** a user changes a filter in `GamesListSection`
- **THEN** the URL search params update and the games list re-fetches without any re-render of `GamesBoardSection` or `GamesAnalysisSection`

### Requirement: GamesBoardSection is self-contained
`GamesBoardSection` SHALL call `useChessGame` directly (reading from the chess store provided by `ChessStoreProvider`). It SHALL manage board orientation locally. It SHALL render `BoardPanel` with no props from any parent component.

#### Scenario: Arrow key navigation does not re-render GamesListSection
- **WHEN** the user presses arrow keys to navigate moves
- **THEN** `GamesBoardSection` re-renders (config changes), but `GamesListSection` and `GamesAnalysisSection` do not re-render

### Requirement: GamesMoveSection is self-contained
`GamesMoveSection` SHALL read `history`, `currentMoveIndex`, and `navigateToIndex` directly from the chess store. It SHALL read `moveClassifications`, `criticalMoveIndices`, and `openingMoveCount` from `GamePageContext`. It SHALL own local `showCriticalOnly` state.

#### Scenario: Move list renders classifications from context
- **WHEN** analysis completes and `moveClassifications` updates in context
- **THEN** `GamesMoveSection` re-renders with the new classifications and `GamesBoardSection` does not re-render

### Requirement: GamesAnalysisSection is self-contained
`GamesAnalysisSection` SHALL read all its data from `GamePageContext` (`selectedGame`, `analysis`, `criticalMoveIndices`, `openingMatch`). It SHALL call `useChessStore(s => s.navigateToIndex)` directly for move click handling rather than receiving it via props or context.

#### Scenario: Analysis panel renders without props from page layout
- **WHEN** `GamesAnalysisSection` mounts
- **THEN** it renders `AnalysisPanel` fully functional using only context and direct store access — no props from the page layout component
