## 1. Export buildTrie

- [ ] 1.1 Add `export` to `buildTrie` in `frontend/src/features/openings/hooks/useOpeningTrie.ts`
- [ ] 1.2 Verify TypeScript compiles with no errors

## 2. Export parseNamePath and buildNameTree

- [ ] 2.1 Add `export` to `parseNamePath` in `frontend/src/features/openings/components/OpeningsList/useNameTree.ts`
- [ ] 2.2 Add `export` to `buildNameTree` in the same file
- [ ] 2.3 Verify TypeScript compiles with no errors

## 3. Export drillReducer

- [ ] 3.1 Add `export` to `drillReducer` in `frontend/src/features/openings/components/DrillTab/useDrillTab.ts`
- [ ] 3.2 Confirm `DrillState` and `DrillAction` types are already exported (they are — verify)

## 4. Extract moveLabel

- [ ] 4.1 Create `frontend/src/features/openings/utils/notesUtils.ts` with exported `moveLabel(moves: string[], index: number): string`
- [ ] 4.2 Remove `moveLabel` from `NotesPanel.tsx`, import from `utils/notesUtils`
- [ ] 4.3 Verify TypeScript compiles with no errors

## 5. Write tests for buildTrie / trie utilities

- [ ] 5.1 Create `frontend/src/features/openings/__tests__/trie.test.ts`:
  - `buildTrie([])` → root with no children, count 0
  - single opening → root count 1, correct child chain
  - two openings sharing a prefix → shared node count 2, branching at divergence
  - `walkTrie` on missing path → null
  - `walkTrie` on valid path → correct node
  - `collectOpenings` on leaf → returns that opening
  - `collectOpenings` on branch → returns all descendant openings

## 6. Write tests for parseNamePath / buildNameTree

- [ ] 6.1 Create `frontend/src/features/openings/__tests__/nameTree.test.ts`:
  - `parseNamePath('Sicilian Defense')` → `['Sicilian Defense']`
  - `parseNamePath('Sicilian Defense: Open Variation')` → `['Sicilian Defense', 'Open Variation']`
  - `parseNamePath("King's Indian Defense: Orthodox Variation, Classical System")` → 3 segments
  - `buildNameTree([])` → empty array
  - `buildNameTree` with openings sharing ECO prefix → shared parent node
  - `buildNameTree` leaf node has correct `opening` reference
  - `buildNameTree` intermediate node has `opening: null`

## 7. Write tests for drillReducer

- [ ] 7.1 Create `frontend/src/features/openings/__tests__/drillReducer.test.ts`:
  - `start` → phase becomes `'drilling'`, moveIndex 0, flash null
  - `correct_move` from drilling → moveIndex increments
  - `correct_move` in wrong phase → state unchanged
  - `complete` → phase becomes `'grading'`
  - `wrong_move` → flash becomes `'wrong'`
  - `wrong_move` in wrong phase → state unchanged
  - `reset_flash` → flash cleared, moveIndex updated
  - `reset_flash` in wrong phase → state unchanged
  - `back_to_queue` → phase becomes `'queue'`

## 8. Write tests for moveLabel

- [ ] 8.1 Create `frontend/src/features/openings/__tests__/notesUtils.test.ts`:
  - index 0 (white move 1) → `'1. e4'`
  - index 1 (black move 1) → `'1... e5'`
  - index 2 (white move 2) → `'2. Nf3'`
  - index 3 (black move 2) → `'2... Nc6'`

## 9. Verification

- [ ] 9.1 Run `vitest run` — all tests pass
- [ ] 9.2 Run `tsc --noEmit` — zero type errors
- [ ] 9.3 Manual smoke test: Browse tab — trie navigation, candidate moves, opening selection
- [ ] 9.4 Manual smoke test: Drill tab — correct move advances, wrong move flashes and undoes, grading screen appears on completion
