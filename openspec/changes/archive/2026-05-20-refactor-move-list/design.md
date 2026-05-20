## Context

`MoveList.tsx` (79 lines) has three issues: white and black move buttons are ~12 lines of duplicated JSX that differ only in `index` and `san`; the scroll effect fires only on `moves.length` changes so keyboard history navigation leaves the selected token off-screen in long games; and `key={pairIndex}` will cause React to recycle wrong DOM nodes if `moves` is ever truncated (puzzle branching).

## Goals / Non-Goals

**Goals:**
- Extract `MoveToken` to eliminate white/black button duplication
- Fix scroll so `selectedIndex` changes also bring the highlighted token into view
- Replace index key with a stable key that survives `moves` truncation

**Non-Goals:**
- Changing `MoveList`'s public props API
- Adding hover-preview or tooltip features
- Extracting a custom hook (component stays simple enough to not need one)

## Decisions

### MoveToken: inline component in MoveList.tsx, not a separate file

`MoveToken` is only used inside `MoveList` and has no standalone meaning. Keeping it in the same file avoids adding a new file for a tiny helper. If it ever needs to be shared, moving it out is trivial.

```tsx
function MoveToken({ san, index, selectedIndex, onClick }) { ... }
```

Alternatives considered:
- `MoveToken.tsx` separate file — unnecessary for a private component
- Inline ternary without extraction — status quo, the duplication we're fixing

### Scroll-to-selected: second `useEffect` on `[selectedIndex]`

Two independent effects for two independent triggers:

```
useEffect(() => scrollToBottom(), [moves.length])      // new move added
useEffect(() => scrollSelected(), [selectedIndex])     // navigation
```

The `selectedIndex` effect uses a `Map<index, RefObject>` or a `ref callback` on each `MoveToken` to find the DOM node, then calls `.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`. Using `block: 'nearest'` avoids jarring jumps when the selected token is already visible — it only scrolls when the token is actually out of view.

Alternatives considered:
- Single combined effect on `[moves.length, selectedIndex]` — merges two independent concerns, harder to reason about
- CSS scroll-snap — doesn't work for programmatic navigation
- `ref` array indexed by move index — simpler than a Map for a sequential list; `refs[index]` is the right approach

### Key: `${pairIndex}-${white}` (pair index + white SAN)

Stable within a game: same pair index always has the same moves unless truncated. When truncated, the white SAN changes → React correctly detects the key change and creates a new node.

```
key={`${pairIndex}-${white}`}
```

Alternatives considered:
- `key={white}` — could collide if the same position recurs (e.g., draw by repetition)
- Full move hash — overkill; `pairIndex + white` is sufficient and cheap

## Risks / Trade-offs

- `block: 'nearest'` on scroll means no scroll if token already visible — the right UX but verify it doesn't feel "stuck" on short lists
- Ref array approach requires the array to be sized by `moves.length`; if moves shrinks (truncation), stale refs at high indices are harmless — they'll be replaced on next render
