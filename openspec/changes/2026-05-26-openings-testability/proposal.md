## Why

The openings feature contains several pure functions buried as unexported module-level functions inside hook files. The trie data structure (`buildTrie`), name hierarchy parser (`parseNamePath`, `buildNameTree`), drill state machine (`drillReducer`), and move label formatter (`moveLabel`) are all untestable despite having no React dependencies. Following the same pattern as `chess-domain-extraction` and `stockfish-extraction`: export the logic, leave the hooks as thin orchestrators, write tests.

## What Changes

- **`useOpeningTrie.ts`** — export `buildTrie`; `walkTrie` and `collectOpenings` already exported
- **`useNameTree.ts`** — export `parseNamePath` and `buildNameTree`
- **`useDrillTab.ts`** — export `drillReducer` and its `DrillState`/`DrillAction` types (already defined, just not exported)
- **`NotesPanel.tsx`** — extract `moveLabel` into `utils/notesUtils.ts` and export it
- **New test files** — vitest unit tests for all four, no DOM, no React

## Capabilities

### Modified Capabilities

- `openings-browse`: Internal — `buildTrie`, `parseNamePath`, `buildNameTree` exported. No behavior change.
- `openings-drill`: Internal — `drillReducer`, `DrillState`, `DrillAction` exported. No behavior change.

## Impact

- `frontend/src/features/openings/hooks/useOpeningTrie.ts` — add `export` to `buildTrie`
- `frontend/src/features/openings/components/OpeningsList/useNameTree.ts` — add `export` to `parseNamePath`, `buildNameTree`
- `frontend/src/features/openings/components/DrillTab/useDrillTab.ts` — add `export` to `drillReducer`, `DrillState`, `DrillAction`
- `frontend/src/features/openings/utils/notesUtils.ts` — new file with exported `moveLabel`
- `frontend/src/features/openings/components/NotesPanel.tsx` — import `moveLabel` from `utils/notesUtils`
- `frontend/src/features/openings/__tests__/trie.test.ts` — new test file
- `frontend/src/features/openings/__tests__/nameTree.test.ts` — new test file
- `frontend/src/features/openings/__tests__/drillReducer.test.ts` — new test file
- `frontend/src/features/openings/__tests__/notesUtils.test.ts` — new test file
- No backend changes
- No new dependencies
- No behavior changes
