## Why

The games tab has a Col 4 "Analysis" placeholder that does nothing. Move classifications are also half-rendered: `inaccuracy`, `mistake`, `excellent` are stored but never colored. The combination means the user has no way to understand *why* a game was lost or *which move* was the turning point.

Four concrete gaps:

1. **Move list colors are incomplete.** Only `best` (blue) and `blunder` (red) are colored. `excellent`, `inaccuracy`, and `mistake` are invisible — data stored, signal thrown away.

2. **No "critical move" concept.** Classification alone doesn't identify *game-defining* moments. A blunder when already -500cp is noise. The move that flips a roughly-equal game to losing is signal. No such concept exists yet.

3. **Analysis panel is empty.** Col 4 shows "Engine analysis coming soon." Nothing appears before or after analysis runs.

4. **No win probability curve.** All the data needed (`analysis.moves[i].score`, `initial_score`, `cpToWinPercent`) exists — but no visual shows how the game unfolded over time.

## What Changes

### Thread 1 — Complete move classification colors

Fill in the missing classifications in `CLASSIFICATION_COLORS`:

```
best:        text-blue-400
excellent:   text-emerald-400 (dim)
good:        (no color, baseline gray)
inaccuracy:  text-yellow-400
mistake:     text-orange-400
blunder:     text-red-400
```

Also add classification **symbols** next to the move SAN in the move list:
```
best:        ✦ (or nothing)
excellent:   !
good:        (nothing)
inaccuracy:  ?!
mistake:     ?
blunder:     ??
```

### Thread 2 — Critical move detection

New pure function `findCriticalMoves(moves, initialScore, userColor)`:

**Definition**: A move is "critical" (game-defining) when:
- It is played by the user
- Win% drops > 15pp for the user on that move
- After this move, the user's win% never recovers above 45%

Returns indices of critical moves. One or more may qualify.

Mark critical moves in the move list with a distinct visual treatment (e.g. amber/pulsing border or a "↓" marker) distinct from classification color.

### Thread 3 — Analysis panel: pre-analysis state

Before analysis runs, show a **game summary card**:

```
┌────────────────────────────────┐
│ vs Magnus (2847)               │
│ ● Loss  ·  Blitz  ·  Jan 15   │
│                                │
│ Sicilian Defense               │
│ ECO: B20                       │
│                                │
│ [Analyze Game]                 │
└────────────────────────────────┘
```

Fields sourced from `selectedGame`: opponent name, opponent rating, result, time class, played_at, opening_name, eco.

### Thread 4 — Analysis panel: post-analysis state

After analysis runs (or game has saved analysis), show:

**Accuracy bars**
```
White  78%  ████████████░░░░
Black  65%  ██████████░░░░░░
```

**Win probability curve** — SVG sparkline, no charting library. X axis = move number, Y axis = white win%. A horizontal midline at 50%. Colored regions: above midline = white winning, below = black winning.

**Move quality breakdown** — counts per classification, per side (user vs opponent), in a compact 2-column table.

**Critical moments** — clickable list of the game-defining moves. Clicking navigates the board to that move.

```
Critical moments
▸ Move 18: Nxe5??  (−18% win)
▸ Move 27: Rxd4?   (−8% win)
```

## What Does Not Change

- Backend: no new API endpoints. Analysis is already saved to `game.analysis`. All new computation is client-side.
- `useGameAnalysis` hook: no changes to analysis logic or saving.
- `GameAnalysis` type: no changes.
- Move list layout/table structure: only colors and symbols added, no layout change.

## Scope

Frontend only. All new logic is pure functions → testable. No new dependencies.
