## 1. Extract shared OpeningsList primitives

- [ ] 1.1 Create `OpeningsList/OpeningsListPrimitives.tsx` with:
  - `ColorBadge({ opening: Opening })` — W/B badge, uses `openingColor`
  - `StarButton({ state: 'full' | 'partial' | 'empty', onClick: (e) => void })` — renders ★/☆ with correct color class
- [ ] 1.2 In `OpeningsList.tsx`: remove local `ColorBadge` and `StarIcon`; import from primitives; replace `<span role="button">` star with `<StarButton>`
- [ ] 1.3 In `OpeningsMoveTree.tsx`: remove inline badge/star markup; import `ColorBadge` and `StarButton` from primitives
- [ ] 1.4 In `OpeningsNameTree.tsx`: same as 1.3
- [ ] 1.5 Run `tsc --noEmit` — zero errors
- [ ] 1.6 Visual check: list/name/move views render badges and stars correctly

## 2. Extract DrillNotesPanel

- [ ] 2.1 Create `DrillTab/DrillNotesPanel.tsx`:
  - Props: `{ openingId: number; moves: string[] }`
  - Renders the `w-64 border-l` sidebar layout with `<NotesPanel openingId={openingId} moveIndex={null} fen={undefined} moves={moves} />`
- [ ] 2.2 In `DrillBoard.tsx`: replace inline `NotesPanel` + sidebar div with `<DrillNotesPanel>`
- [ ] 2.3 In `DrillGrading.tsx`: same as 2.2
- [ ] 2.4 Run `tsc --noEmit` — zero errors

## 3. Dissolve useOpeningsList

- [ ] 3.1 In `OpeningsList.tsx`:
  - Add `const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)`
  - Add `const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)`
  - Call `const { ids: favoriteIds, toggleFavorite, bulkToggle } = useFavorites()` directly
  - Derive `displayed` inline with `useMemo`
  - Remove the `useOpeningsList` call
- [ ] 3.2 Delete `frontend/src/features/openings/components/OpeningsList/useOpeningsList.ts`
- [ ] 3.3 Run `tsc --noEmit` — zero errors; confirm no other file imports `useOpeningsList`

## 4. Split useDrillTab → useDrillQueue + useDrillTab

- [ ] 4.1 Create `frontend/src/features/openings/hooks/useDrillQueue.ts`:
  - `useQuery` for drill queue (enabled when logged in)
  - `useMutation` for `drillApi.review` with queue invalidation
  - Returns `{ queue, isLoading, submitGrade(openingId, grade) }`
- [ ] 4.2 In `useDrillTab.ts`:
  - Replace inline `useQuery` + `useMutation` + `reviewMutation.mutate` with `useDrillQueue`
  - Replace `handleGrade` body with `submitGrade(state.item.opening_id, grade)`
  - Remove `useQueryClient` import
- [ ] 4.3 Run `tsc --noEmit` — zero errors

## 5. Verification

- [ ] 5.1 Run `vitest run` — all tests pass
- [ ] 5.2 Manual smoke test: Browse tab — list/name/move views, favorites toggle, bulk star, search
- [ ] 5.3 Manual smoke test: Drill tab — start drill, correct move advances, wrong move flashes/undoes, grading screen, grade submission returns to queue
- [ ] 5.4 Confirm `useOpeningsList.ts` no longer exists: `ls frontend/src/features/openings/components/OpeningsList/`
- [ ] 5.5 Confirm no inline badge/star markup remains in tree files: `grep -n "bg-gray-200\|bg-gray-700" OpeningsMoveTree.tsx OpeningsNameTree.tsx`
