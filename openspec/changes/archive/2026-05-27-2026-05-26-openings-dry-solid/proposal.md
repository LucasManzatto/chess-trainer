## Why

The openings feature has three concrete DRY/SOLID issues discovered during architecture review:

1. **DRY — `ColorBadge` and star button duplicated across three files.** `OpeningsList.tsx` defines `ColorBadge` and `StarIcon` components; `OpeningsMoveTree.tsx` and `OpeningsNameTree.tsx` both reinvent the same badge/star markup inline. Any color or icon change must be made in three places.

2. **DRY — `NotesPanel` layout duplicated in `DrillBoard` and `DrillGrading`.** Both drill screens render an identical `<NotesPanel>` call with the same `moveIndex={null} fen={undefined}` defaults inside the same `w-64 border-l` sidebar layout.

3. **SRP — `useOpeningsList` conflates UI state with domain concerns.** `viewMode` and `showFavoritesOnly` are local UI state that belongs in the component; the hook wraps them alongside `useFavorites` for no reason. Per CLAUDE.md: "colocate state close to where it's used."

4. **SRP — `useDrillTab` has five responsibilities.** Server state (queue fetch + grade mutation), state machine (reducer), chess board control, move validation, and wrong-move undo timing all live in one 128-line hook. Each concern is hard to change without touching the others.

## What Changes

**Fix 1 — shared OpeningsList primitives**
- Create `frontend/src/features/openings/components/OpeningsList/OpeningsListPrimitives.tsx` with exported `ColorBadge` and `StarButton` components
- Remove the inline duplicates from `OpeningsList.tsx`, `OpeningsMoveTree.tsx`, `OpeningsNameTree.tsx`; import from the new file

**Fix 2 — `DrillNotesPanel`**
- Create `frontend/src/features/openings/components/DrillTab/DrillNotesPanel.tsx` wrapping the shared `w-64 border-l` sidebar layout + `NotesPanel` call
- Replace the duplicate render in `DrillBoard.tsx` and `DrillGrading.tsx`

**Fix 3 — dissolve `useOpeningsList`**
- Move `viewMode` and `showFavoritesOnly` state into `OpeningsList` component directly
- `OpeningsList` calls `useFavorites()` directly
- Delete `useOpeningsList.ts`

**Fix 4 — split `useDrillTab`**
- Extract `useDrillQueue` hook: owns the TanStack Query fetch and grade mutation; returns `{ queue, isLoading, submitGrade }`
- `useDrillTab` becomes the orchestrator: calls `useDrillQueue`, owns `useReducer`, owns `useChessGame`, owns `handleMoveValidate` and the undo-flash `useEffect`

## Capabilities

### Modified Capabilities

- `openings-browse`: Internal — `OpeningsList` restructured. No behavior change.
- `openings-drill`: Internal — `useDrillTab` split. No behavior change.

## Impact

- `frontend/src/features/openings/components/OpeningsList/OpeningsListPrimitives.tsx` — new file (`ColorBadge`, `StarButton`)
- `frontend/src/features/openings/components/OpeningsList/OpeningsList.tsx` — remove `ColorBadge`/`StarIcon`, import from primitives; inline `viewMode`/`showFavoritesOnly` state; call `useFavorites()` directly
- `frontend/src/features/openings/components/OpeningsList/OpeningsMoveTree.tsx` — remove inline badge/star; import from primitives
- `frontend/src/features/openings/components/OpeningsList/OpeningsNameTree.tsx` — remove inline badge/star; import from primitives
- `frontend/src/features/openings/components/OpeningsList/useOpeningsList.ts` — deleted
- `frontend/src/features/openings/components/DrillTab/DrillNotesPanel.tsx` — new file
- `frontend/src/features/openings/components/DrillTab/DrillBoard.tsx` — replace `NotesPanel` sidebar with `DrillNotesPanel`
- `frontend/src/features/openings/components/DrillTab/DrillGrading.tsx` — replace `NotesPanel` sidebar with `DrillNotesPanel`
- `frontend/src/features/openings/hooks/useDrillQueue.ts` — new file
- `frontend/src/features/openings/components/DrillTab/useDrillTab.ts` — simplified; delegates server state to `useDrillQueue`
- No backend changes
- No new dependencies
- No behavior changes
