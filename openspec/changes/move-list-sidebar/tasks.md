## 1. Tailwind Setup

- [x] 1.1 Install `tailwindcss` and `@tailwindcss/vite` in `frontend/`
- [x] 1.2 Add `@tailwindcss/vite` plugin to `frontend/vite.config.ts`
- [x] 1.3 Add `@import "tailwindcss"` at the top of `frontend/src/index.css`

## 2. ChessBoard API Update

- [x] 2.1 Add `san: string` field to `MoveResult` type in `ChessBoard.tsx`
- [x] 2.2 Populate `san` from `chess.js` move object in `handlePieceDrop`

## 3. MoveList Component

- [x] 3.1 Create `frontend/src/components/MoveList/` directory with `index.ts` barrel export
- [x] 3.2 Implement `MoveList.tsx` — accepts `moves: MoveResult[]` prop, groups into pairs, renders move number + white + black tokens
- [x] 3.3 Highlight the last move token with a distinct style
- [x] 3.4 Add `useRef` + `useEffect` to auto-scroll the list container to the bottom on new move
- [x] 3.5 Apply fixed max-height with `overflow-y: auto` so long games don't break layout
- [x] 3.6 Render "No moves yet" placeholder when `moves` is empty

## 4. Main Page Layout

- [x] 4.1 Update `App.tsx`: add `moves` state (`MoveResult[]`), pass `onMove` to `ChessBoard` that appends to state, render `<MoveList moves={moves} />` beside board
- [x] 4.2 Replace `App.css` layout with Tailwind classes — two-column flex/grid layout, responsive stack on < 768px, board column max-width ~560px

## 5. Verification

- [x] 5.1 Run `tsc --noEmit` — zero errors
- [x] 5.2 Run dev server, make several moves, verify move list updates with correct SAN notation and auto-scrolls
