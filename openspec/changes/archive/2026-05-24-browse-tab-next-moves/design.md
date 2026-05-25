## Context

BrowseTab currently renders a static view of a selected opening — board, move list, notes. ExploreTab has an interactive trie-based system that computes candidate next moves at any position. The trie infrastructure (`useOpeningTrie`, `walkTrie`) already exists and is reusable.

## Goals / Non-Goals

**Goals:**
- Show candidate next moves (continuations) in BrowseTab when an opening is selected
- Reuse the existing `ContinuationsList` component and trie utilities without modification
- Display only when an opening is selected; hidden otherwise

**Non-Goals:**
- Making the BrowseTab board interactive (user cannot play moves)
- Highlighting candidate moves as board arrows (ExploreTab concern only)
- Filtering continuations to only moves within the selected opening

## Decisions

### Trie walk input: use selected opening's moves up to current moveIndex

`useBrowseTab` already tracks `moveIndex` (null = final position). The moves to walk are `selected.moves.slice(0, moveIndex === null ? selected.moves.length : moveIndex + 1)`. This gives the correct trie node for any position the user navigates to.

**Alternative considered**: Walk trie from the board FEN rather than move sequence. Rejected — the trie is keyed by SAN move sequences, not FEN, so move sequence is the correct input.

### Component reuse: share `ContinuationsList` from ExploreTab

`ContinuationsList` accepts `Map<string, number>` and renders sorted continuations with counts. It is layout-agnostic. Moving it to a shared location (`components/`) is unnecessary — importing cross-feature is fine for a small, stable component.

**Alternative**: New component in BrowseTab folder. Rejected — pure duplication.

### Layout: continuations inside the MoveList column

The BrowseTab has a 220px moves column. Continuations render below the scrollable move list in the same column section, separated by a border. No new grid column needed.

**Alternative**: Add a fifth column. Rejected — increases layout complexity for a small panel that naturally relates to the move list.

### Trie scope: all openings (not just selected opening)

Continuations come from the global trie (all openings), not just the selected one. This matches ExploreTab behavior and gives users cross-opening context.

## Risks / Trade-offs

- [Continuations empty at leaf nodes] → Expected behavior; `ContinuationsList` renders nothing. No special handling needed.
- [220px column may be narrow for long SAN moves] → Same constraint as existing MoveList; acceptable.
