## Why

BrowseTab shows a selected opening's moves but gives no context about what other openings branch off at each position. Users studying a line have to switch to ExploreTab to see continuations, breaking their flow.

## What Changes

- When an opening is selected in BrowseTab and the user navigates to a move, a continuations panel shows the next possible moves (and how many openings contain each), mirroring ExploreTab's `ContinuationsList`.
- The panel is hidden when no opening is selected.
- `useBrowseTab` gains trie-based candidate move computation (reusing existing `useOpeningTrie` / `walkTrie`).

## Capabilities

### New Capabilities

_(none — this is a UI enhancement within an existing capability)_

### Modified Capabilities

- `opening-browse`: Add requirement — when an opening is selected, BrowseTab SHALL display a list of candidate next moves (continuations) derived from the full openings trie at the current move position.

## Impact

- `BrowseTab.tsx` — add `ContinuationsList` panel to layout
- `useBrowseTab.ts` — add `useOpeningTrie`, `walkTrie`, `candidateMoves` computation
- `opening-browse` spec — new requirement + scenarios
- No backend changes, no new dependencies
