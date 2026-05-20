## Context

`useGameHistory` accepts moves one at a time via `handleMove`. Studying a real game requires loading all moves at once from PGN text. `chess.js` already handles PGN parsing via `loadPgn()` + `history({ verbose: true })`, giving SAN and resulting FEN for each move. The only missing pieces are: a parse function in the hook, game metadata state, and a minimal import UI.

## Goals / Non-Goals

**Goals:**
- `loadFromPgn(pgn)` replaces current game with the parsed game
- Display White, Black, Event, Date headers from the PGN when present
- Inline error message on malformed PGN
- Toggle-able import panel on the free-play page

**Non-Goals:**
- PGN file upload (textarea paste is sufficient)
- Variations/branching (PGN mainline only — variations are ignored)
- Multiple games in one PGN file (first game only)
- Saving/persisting imported games

## Decisions

### `loadFromPgn` in `useGameHistory`, not a separate hook

PGN import is just another way to populate `moves[]` and `viewIndex`. Keeping it in the existing hook avoids duplicating navigation logic and keeps the page component's interface unchanged.

```typescript
function loadFromPgn(pgn: string): { ok: true } | { ok: false; error: string }
```

Returns a result object so the UI can display parse errors without throwing. On success, resets `moves` to the parsed move list, sets `viewIndex` to `0` (first move), and clears `gameMetadata` → replaces with parsed headers.

### `viewIndex` set to `0` after import (not `null`)

After import the board is non-interactive — the game is already played. Setting `viewIndex` to `0` (first position, start) puts the user at the beginning for review, and `interactive` stays `false` until the user navigates past the last move (which they can't, since it's a finished game). Keeps the existing navigation behavior exactly as-is.

Actually: set `viewIndex` to `null` after import → board shows the final position, interactive=false would be confusing since moves.length > 0. 

Correct decision: set `viewIndex` to `moves.length - 1` after import so the board shows the final position and the last move is highlighted. User can navigate backward from there.

### `gameMetadata` as separate state, `null` during free play

```typescript
type GameMetadata = { white?: string; black?: string; event?: string; date?: string }
```

`null` when no PGN loaded (free play). Displayed above the move list as a small header when non-null. Cleared when `loadFromPgn` is called again or when a new move is played (indicating the user has left the imported game).

### PgnImportPanel as a collapsible panel, not a modal

A modal blocks the board. A panel that appears above or beside the move list is less intrusive. Toggle via a button on the free-play page. Panel closes automatically on successful import.

### Parse errors: inline in the panel

Show a `<p className="text-red-400 text-sm">` below the textarea. Cleared on next submit attempt.

## Risks / Trade-offs

- `chess.js` `loadPgn` throws on invalid PGN — must wrap in try/catch.
- PGN with clock annotations (`{ [%clk 0:05:00] }`) and other comments are handled by chess.js (stripped automatically).
- After loading, `interactive` becomes `false` (viewIndex is set to last move index). User cannot play from the imported position. This is intentional for the analysis use case; free play starts a new game.
