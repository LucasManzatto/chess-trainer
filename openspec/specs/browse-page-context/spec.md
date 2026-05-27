## ADDED Requirements

### Requirement: BrowsePageContext provides cross-cutting browse page state
A `BrowsePageContext` SHALL exist, provided by `BrowsePageProvider`, that holds state shared across multiple sections of the browse page. The context SHALL expose: `openings`, `isLoading`, `selected`, `exactMatch`, `candidateMoves`, `shapes`, `search`, `setSearch`, `selectOpening`, and `openingMoveIndex`. Components outside the `BrowsePageProvider` subtree SHALL NOT access this context.

#### Scenario: Context available to section components
- **WHEN** `BrowseOpeningsSection`, `BrowseBoardSection`, `BrowseMoveSection`, or `BrowseNotesSection` call `useBrowsePageContext`
- **THEN** they receive the current context value without any props being passed from the page layout

#### Scenario: Context throws outside provider
- **WHEN** `useBrowsePageContext` is called outside a `BrowsePageProvider`
- **THEN** it throws an error indicating the hook was used outside its provider

### Requirement: BrowsePage layout component holds zero state
The `BrowsePage` layout component (inner, after `ChessStoreProvider` and `BrowsePageProvider`) SHALL render a grid with four section slot components and pass zero props to them.

#### Scenario: Page layout renders four sections
- **WHEN** a user navigates to the openings browse page
- **THEN** `BrowseOpeningsSection`, `BrowseBoardSection`, `BrowseMoveSection`, and `BrowseNotesSection` all render in the grid layout

### Requirement: BrowseOpeningsSection is self-contained
`BrowseOpeningsSection` SHALL read `openings`, `isLoading`, `selected`, `exactMatch`, `search`, `setSearch`, and `selectOpening` from `BrowsePageContext`. It SHALL render `OpeningsList` and the `AddToDrillButton` (when applicable) using only context data.

#### Scenario: Opening selection updates context and board
- **WHEN** a user clicks an opening in `BrowseOpeningsSection`
- **THEN** `selectOpening` from context loads the opening moves into the chess store and updates the URL `openingId` param

### Requirement: BrowseBoardSection is self-contained
`BrowseBoardSection` SHALL call `useChessGame` directly for board config. It SHALL read `shapes` from `BrowsePageContext`. It SHALL manage board orientation locally (initializing from context when an opening is selected). It SHALL render `BoardPanel` with no props from any parent component.

#### Scenario: Arrow key navigation does not re-render BrowseOpeningsSection
- **WHEN** the user presses arrow keys to navigate moves
- **THEN** `BrowseBoardSection` re-renders (config changes), but `BrowseOpeningsSection` does not re-render

### Requirement: BrowseMoveSection is self-contained
`BrowseMoveSection` SHALL read `history` and `currentMoveIndex` directly from the chess store. It SHALL read `candidateMoves` from `BrowsePageContext`. It SHALL call `useChessStore(s => s.navigateToIndex)` and `useChessStore(s => s.reset)` directly for move navigation and board reset.

#### Scenario: Move list and continuations render without parent props
- **WHEN** `BrowseMoveSection` mounts
- **THEN** `MoveList` and `ContinuationsList` render fully functional using only chess store selectors and context — no props from the page layout

### Requirement: BrowseNotesSection is self-contained
`BrowseNotesSection` SHALL read `selected`, `openingMoveIndex`, and the current FEN from `BrowsePageContext` or the chess store directly. It SHALL render `NotesPanel` (or the empty-state prompt) using only context and store data.

#### Scenario: Notes panel renders for selected opening
- **WHEN** a user selects an opening
- **THEN** `BrowseNotesSection` renders `NotesPanel` with the correct `openingId`, `moveIndex`, `fen`, and `moves` — no props passed from the page layout
