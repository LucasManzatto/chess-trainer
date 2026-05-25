## Context

The Games tab currently lets users replay their chess.com games but provides no analytical feedback. Players must manually identify mistakes. The existing `usePositionEvaluation` hook already runs Stockfish WASM (depth 18, lite single-threaded build) as a persistent Web Worker — this infrastructure can be reused for batch analysis.

The backend `Game` model stores PGN and move arrays but has no analysis column. The frontend already has all FENs available through `useChessGame`'s history.

## Goals / Non-Goals

**Goals:**
- Let users trigger full game analysis from the Games tab
- Evaluate all N+1 positions (initial + after each move) sequentially at depth 18
- Classify each move and compute per-player accuracy
- Persist analysis to backend so it doesn't need to be re-run each session
- Surface results in MoveList (colored moves) and GamesList (accuracy badges)

**Non-Goals:**
- Server-side Stockfish (v1 is browser-only)
- Automatic analysis on sync
- Engine line / PV display
- Brilliant move detection (requires complex heuristics)
- Analysis at depth > 18 (lite WASM limitation)

## Decisions

### Separate worker for analysis vs. live evaluation

**Decision**: `useGameAnalysis` spawns its own Stockfish worker, independent of `usePositionEvaluation`.

**Rationale**: Sharing the worker would require complex coordination between the live eval (which debounces and stops/restarts on FEN change) and the sequential batch analysis (which must not be interrupted). Two independent workers is simpler and avoids WASM crash edge cases documented in `usePositionEvaluation`.

**Alternative considered**: Pausing live eval during analysis — rejected because it creates coupling and would break the eval bar while analysis runs.

### cp_loss computation

**Decision**: Evaluate all N+1 FENs to get scores, then compute per-move loss from adjacent scores.

```
positions = [initial_fen, fen_0, fen_1, ..., fen_N]
scores    = [s0, s1, ..., sN]  (all normalized to white's perspective)

white move i: cp_loss = max(0, scores[i] - scores[i+1])
black move i: cp_loss = max(0, scores[i+1] - scores[i])
```

**Alternative considered**: Evaluate only the positions after each move and infer — rejected because the initial position score is needed to compute cp_loss for the first move.

### Classification thresholds

| cp_loss | Classification |
|---------|---------------|
| 0 AND played == best_move | best |
| 1–10 | excellent |
| 11–25 | good |
| 26–50 | inaccuracy |
| 51–100 | mistake |
| 101+ | blunder |

Follows lichess conventions. Close to chess.com but uses simpler cp-based thresholds rather than win-probability deltas (acceptable for v1).

### Accuracy formula

```
accuracy = clamp(103.1668 × exp(−0.04354 × avg_cp_loss) − 3.1669, 0, 100)
```

Lichess formula. Computed separately over white's moves and black's moves.

### Storage: JSONB on Game model

**Decision**: Store full `GameAnalysis` JSON in a nullable `analysis` JSONB column on the `games` table.

**Rationale**: Analysis is always read/written as a unit (no querying into individual moves). JSONB avoids a normalized `move_analyses` table and a join on every game fetch.

**Alternative considered**: Separate `game_analyses` table — rejected as over-engineering for v1.

### PUT endpoint semantics

`PUT /api/v1/games/{id}/analysis` — idempotent, always overwrites. Re-analysis is supported by design. No versioning needed for v1.

## Risks / Trade-offs

**[Risk] Tab must stay open during analysis** → Mitigation: Show clear progress bar; disable navigation away while running (or warn user). Analysis for a 60-move game takes 1–3 minutes.

**[Risk] Lite WASM misses subtle inaccuracies** → Mitigation: Acceptable for v1. Blunder/mistake detection at depth 18 is reliable. Document the limitation.

**[Risk] Two workers = double memory pressure** → Mitigation: `useGameAnalysis` worker is terminated immediately after analysis completes (or on error/unmount). It's not persistent like the eval worker.

**[Risk] Score normalization bugs** → Mitigation: All scores normalized to white's perspective before storage in `usePositionEvaluation` pattern. Must apply same normalization in `useGameAnalysis`.
