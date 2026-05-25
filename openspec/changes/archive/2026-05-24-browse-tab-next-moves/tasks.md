## 1. Hook: add trie-based candidate moves to useBrowseTab

- [x] 1.1 Import `useOpeningTrie` and `walkTrie` in `useBrowseTab.ts`
- [x] 1.2 Build trie from `openings` data using `useOpeningTrie`
- [x] 1.3 Compute `currentMoves` — `selected.moves.slice(0, moveIndex === null ? selected.moves.length : moveIndex + 1)` when selected, else `[]`
- [x] 1.4 Compute `candidateMoves: Map<string, number>` by walking trie with `currentMoves` and extracting children; return empty map when no opening selected or trie node not found
- [x] 1.5 Return `candidateMoves` from `useBrowseTab`

## 2. UI: render ContinuationsList in BrowseTab moves column

- [x] 2.1 Import `ContinuationsList` from `ExploreTab/ContinuationsList` in `BrowseTab.tsx`
- [x] 2.2 Destructure `candidateMoves` from `useBrowseTab()`
- [x] 2.3 Render `<ContinuationsList candidateMoves={candidateMoves} />` inside the moves column section, below the `MoveList` (only when `selected` is truthy — `ContinuationsList` already guards on empty map)
