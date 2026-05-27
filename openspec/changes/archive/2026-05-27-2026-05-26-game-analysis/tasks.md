## 1. Complete move classification colors and symbols

- [ ] 1.1 In `MoveList.tsx`: update `CLASSIFICATION_COLORS` to include all six classifications:
  ```ts
  best:        'text-blue-400'
  excellent:   'text-emerald-400'
  good:        ''
  inaccuracy:  'text-yellow-400'
  mistake:     'text-orange-400'
  blunder:     'text-red-400'
  ```
- [ ] 1.2 Add `CLASSIFICATION_SYMBOLS` map:
  ```ts
  best:        ''
  excellent:   '!'
  good:        ''
  inaccuracy:  '?!'
  mistake:     '?'
  blunder:     '??'
  ```
- [ ] 1.3 In `MoveToken`: render symbol after SAN when classification is set and symbol is non-empty. Symbol should inherit the classification color. Layout: `{san} {symbol}` — symbol in a `<span>` with smaller font, right-aligned within the button.
- [ ] 1.4 Run `tsc --noEmit` — zero errors.

## 2. Critical move detection

- [ ] 2.1 Create `frontend/src/features/games/utils/analysisUtils.ts`:
  - Import `cpToWinPercent` from `../../../chess`
  - `findCriticalMoves(moves: MoveAnalysis[], initialScore: number, userColor: 'white' | 'black'): number[]`
    - Reconstruct win% timeline from `initialScore` + `moves[i].score`
    - Identify moves played by user (white moves = even indices, black = odd)
    - For each user move: compute win% drop = `winPct[i] - winPct[i+1]`
    - A move is critical if: drop > 15pp AND win% never recovers above 45% after this point
    - Return sorted array of move indices (0-based within the moves array)
  - `computeWinPercentTimeline(initialScore: number, scores: number[]): number[]`
    - Returns array of length `scores.length + 1`: `[cpToWinPercent(initialScore), ...scores.map(cpToWinPercent)]`
- [ ] 2.2 In `MoveList.tsx`: accept `criticalMoveIndices?: number[]` prop
- [ ] 2.3 In `MoveToken`: when index is in `criticalMoveIndices`, add a "↓" marker (dim amber color, non-bold) displayed before the SAN. This is independent of classification symbol.
- [ ] 2.4 In `useGameBoard.ts`: compute `criticalMoveIndices` via `useMemo`:
  ```ts
  const criticalMoveIndices = useMemo(() => {
    const src = analysis ?? selectedGame?.analysis
    if (!src || !selectedGame) return []
    return findCriticalMoves(src.moves, src.initial_score ?? 0, selectedGame.user_color)
  }, [analysis, selectedGame?.analysis, selectedGame?.user_color])
  ```
- [ ] 2.5 Pass `criticalMoveIndices` through `useGamesTab` return value and down to `MoveList` in `GamesTab.tsx`
- [ ] 2.6 Run `tsc --noEmit` — zero errors.

## 3. Analysis panel — pre-analysis game summary card

- [ ] 3.1 Create `frontend/src/features/games/components/GamesTab/GameSummaryCard.tsx`:
  - Props: `game: Game`, `onAnalyze: () => void`, `analyzeStatus: 'idle' | 'running' | 'done' | 'error'`, `analyzeProgress: { current: number; total: number }`
  - Displays: opponent username + rating, result badge (W/L/D), time class, played_at (via `formatDate`), opening_name, eco
  - Displays analyze button with loading state
  - No analysis data — pure display of game metadata
- [ ] 3.2 Extract analyze button logic from `GamesTab.tsx` `BoardPanel` title prop into `GameSummaryCard`
  - The title prop on `BoardPanel` currently contains an inline analyze button — remove it, simplify `BoardPanel` title to just the matchup string
- [ ] 3.3 In `GamesTab.tsx`: render `GameSummaryCard` at top of Col 4 when `selectedGame` is set and analysis is not yet available
- [ ] 3.4 Run `tsc --noEmit` — zero errors.

## 4. Analysis panel — post-analysis content

### 4a. Accuracy bars

- [ ] 4.1 Create `frontend/src/features/games/components/GamesTab/AccuracyBar.tsx`:
  - Props: `whiteAccuracy: number`, `blackAccuracy: number`, `userColor: 'white' | 'black'`
  - Two rows: label + percentage + filled bar. User's row highlighted.
  - Pure presentational component.

### 4b. Move quality breakdown

- [ ] 4.2 Create `frontend/src/features/games/utils/analysisUtils.ts` (extend from task 2.1):
  - `countClassifications(moves: MoveAnalysis[], userColor: 'white' | 'black'): { user: Record<MoveClassification, number>, opponent: Record<MoveClassification, number> }`
    - User moves: even indices if white, odd if black
    - Count each classification for user vs opponent
- [ ] 4.3 Create `frontend/src/features/games/components/GamesTab/MoveQualityTable.tsx`:
  - Props: `userCounts: Record<MoveClassification, number>`, `opponentCounts: Record<MoveClassification, number>`
  - Compact table: classification label | user count | opponent count
  - Order: blunder → mistake → inaccuracy → good → excellent → best
  - Show only rows where either count > 0

### 4c. Win probability curve

- [ ] 4.4 Create `frontend/src/features/games/utils/analysisUtils.ts` (extend):
  - Already have `computeWinPercentTimeline` from task 2.1
- [ ] 4.5 Create `frontend/src/features/games/components/GamesTab/WinProbabilityCurve.tsx`:
  - Props: `timeline: number[]`, `userColor: 'white' | 'black'`, `criticalMoveIndices: number[]`
  - SVG-based sparkline, no charting library
  - Width: fill container. Height: ~80px.
  - X axis: move index. Y axis: win% (0–100, midline at 50%)
  - Fill above midline: white side color (light). Fill below: dark side color.
  - Mark critical move positions with a vertical tick/dot.
  - Midline rendered as a dashed horizontal line.

### 4d. Critical moments list

- [ ] 4.6 Create `frontend/src/features/games/components/GamesTab/CriticalMomentsList.tsx`:
  - Props: `moves: MoveAnalysis[]`, `criticalMoveIndices: number[]`, `timeline: number[]`, `onMoveClick: (index: number) => void`
  - Renders a list of clickable critical moves
  - Each item: move number (human-readable: "Move 18"), SAN (from `moves[i].san` — may be empty string currently, handle gracefully), win% drop formatted as "−18%"
  - Clicking calls `onMoveClick(index)` to navigate board

### 4e. Wire up the panel

- [ ] 4.7 Create `frontend/src/features/games/components/GamesTab/AnalysisPanel.tsx`:
  - Props: `game: Game | null`, `analysis: GameAnalysis | null`, `criticalMoveIndices: number[]`, `onMoveClick: (index: number) => void`, `onAnalyze: () => void`, `analyzeStatus`, `analyzeProgress`
  - When `game` is null: render empty state ("Select a game to begin")
  - When `game` set, no analysis: render `GameSummaryCard`
  - When analysis available: render `GameSummaryCard` (compact) + `AccuracyBar` + `WinProbabilityCurve` + `MoveQualityTable` + `CriticalMomentsList`
- [ ] 4.8 In `GamesTab.tsx`: replace Col 4 placeholder with `<AnalysisPanel />`. Pass `analysis` from `useGamesTab` (already returned from `useGameBoard`).
- [ ] 4.9 Pass `winPercentTimeline` from `useGameBoard` (computed via `computeWinPercentTimeline`).
- [ ] 4.10 Run `tsc --noEmit` — zero errors.

## 5. Tests

- [ ] 5.1 Create `frontend/src/features/games/__tests__/analysisUtils.test.ts`:
  - `computeWinPercentTimeline`: length = scores.length + 1, first element = cpToWinPercent(initialScore)
  - `findCriticalMoves`: no moves → [], user never drops below 45% → [], drop > 15pp but recovers → not critical, drop > 15pp and never recovers → critical, multiple critical moves → all returned
  - `countClassifications`: white user gets even-indexed moves, black gets odd, counts are correct

## 6. Verification

- [ ] 6.1 Run `vitest run` — all tests pass
- [ ] 6.2 Run `tsc --noEmit` — zero errors
- [ ] 6.3 Manual: select game without analysis — summary card with analyze button visible
- [ ] 6.4 Manual: run analysis — accuracy bars, curve, quality table, critical moments all appear
- [ ] 6.5 Manual: click critical moment — board navigates to that move
- [ ] 6.6 Manual: move list shows symbols (??, ?, ?!, !) and colors for all classifications
- [ ] 6.7 Manual: critical moves in move list marked with ↓
