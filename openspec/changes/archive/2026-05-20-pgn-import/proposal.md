## Why

Free play lets users practice moves but not study real games. PGN import unlocks the existing history navigation for studying any game — grandmaster games, own tournament games, opening preparation — using no new dependencies (chess.js already parses PGN).

## What Changes

- Add `loadFromPgn(pgn: string)` to `useGameHistory` — parses PGN, replaces current game state with the loaded moves
- Add `PgnImportPanel` component — textarea for pasting PGN, parse button, inline error feedback
- Add "Import PGN" button on the free-play page that toggles the import panel
- Display game metadata (White, Black, Event, Date) from PGN headers above the move list when a PGN game is loaded

## Capabilities

### New Capabilities
- `pgn-import`: Paste PGN text to load a game into the board for review

### Modified Capabilities
- `game-history`: `useGameHistory` gains a `loadFromPgn` function; existing move/navigation requirements unchanged

## Impact

- `frontend/src/hooks/useGameHistory.ts`: add `loadFromPgn`, add `gameMetadata` state
- `frontend/src/routes/index.tsx`: add import panel toggle + `PgnImportPanel`
- New component: `frontend/src/components/PgnImport/PgnImportPanel.tsx`
- No new npm dependencies
