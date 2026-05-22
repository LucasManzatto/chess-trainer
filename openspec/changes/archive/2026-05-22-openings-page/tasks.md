## 1. Database & Seeding

- [x] 1.1 Add `python-chess` to `backend/requirements.txt`
- [x] 1.2 Write DB migration creating `openings`, `opening_comments`, `position_comments`, `opening_progress` tables
- [x] 1.3 Write `backend/scripts/seed_openings.py` — downloads TSVs, computes FEN via python-chess, inserts into `openings` table
- [x] 1.4 Extend seed script to emit `frontend/public/openings.json` with all 3,704 openings
- [x] 1.5 Run migration and seed script; verify 3,704 rows in `openings` and `openings.json` present

## 2. Backend API — Comments

- [x] 2.1 Create `backend/src/app/api/v1/openings.py` router with Pydantic schemas for comments
- [x] 2.2 Implement `GET /api/openings/{id}/comments` — returns current user's opening-level comments
- [x] 2.3 Implement `POST /api/openings/{id}/comments` — creates opening comment (auth required)
- [x] 2.4 Implement `PUT /api/openings/comments/{comment_id}` — updates comment (auth + ownership check)
- [x] 2.5 Implement `DELETE /api/openings/comments/{comment_id}` — deletes comment (auth + ownership check)
- [x] 2.6 Implement `GET /api/openings/{id}/position-comments` — returns current user's move-level comments
- [x] 2.7 Implement `POST /api/openings/{id}/position-comments` — creates position comment (auth required)
- [x] 2.8 Implement `PUT /api/openings/position-comments/{comment_id}` — updates position comment
- [x] 2.9 Implement `DELETE /api/openings/position-comments/{comment_id}` — deletes position comment

## 3. Backend API — Drill (SRS)

- [x] 3.1 Implement `GET /api/openings/drill/queue` — returns openings with due_date ≤ today for current user, ordered by due_date asc
- [x] 3.2 Implement `POST /api/openings/{id}/drill` — creates `opening_progress` record ("Add to Drill")
- [x] 3.3 Implement `POST /api/openings/{id}/review` — accepts grade (0–5), runs SM-2, updates `opening_progress`
- [x] 3.4 Register openings router in `backend/src/app/main.py`
- [x] 3.5 Regenerate frontend API client: `npm run gen:api`

## 4. Frontend — Data Layer

- [x] 4.1 Create `src/features/openings/useOpenings.ts` — lazy-fetches `openings.json`, caches in module scope
- [x] 4.2 Define `Opening` TypeScript type: `{ id: number; eco: string; name: string; pgn: string; fen: string; moves: string[] }`
- [x] 4.3 Create `src/features/openings/useOpeningTrie.ts` — builds trie from openings array in a `useMemo`

## 5. Frontend — Page Shell

- [x] 5.1 Replace placeholder in `src/routes/openings/index.tsx` with three-tab layout (Browse / Explore / Drill)
- [x] 5.2 Wire tab state so Browse is default; persist active tab in URL search param `?tab=browse|explore|drill`

## 6. Frontend — Browse Tab

- [x] 6.1 Create `src/features/openings/BrowseTab.tsx` with three-column layout (list | board | detail)
- [x] 6.2 Implement ECO filter buttons (A B C D E + All) and name search input; filter runs client-side
- [x] 6.3 Render virtualised (or windowed) opening list; highlight selected row
- [x] 6.4 Wire selected opening to `ChessBoard` (read-only, shows `fen`) and `MoveList`
- [x] 6.5 Make MoveList clicks update board to intermediate position (play moves 0..N using chess.js)
- [x] 6.6 Add "Add to Drill" button in detail panel (visible to authenticated users); calls `POST /api/openings/{id}/drill`; show "In Drill" if already added

## 7. Frontend — Explore Tab

- [x] 7.1 Create `src/features/openings/ExploreTab.tsx`
- [x] 7.2 Render interactive `ChessBoard` backed by local chess.js game state
- [x] 7.3 After each move, compute candidate next moves from trie (`trieNode.children.keys()`) with counts
- [x] 7.4 Highlight candidate squares on ChessGround using `drawable.shapes`; render count badge overlay
- [x] 7.5 Render sidebar list of openings matching current position (all openings in current trie subtree)
- [x] 7.6 Highlight exact-match opening in sidebar when current position equals its final FEN
- [x] 7.7 Implement "Reset" button (clears game to start, restores full trie root)
- [x] 7.8 Implement "Undo" button (pops last move, walks trie back one level)
- [x] 7.9 Show "No openings from here" when trie node has no children

## 8. Frontend — Drill Tab

- [x] 8.1 Create `src/features/openings/DrillTab.tsx`
- [x] 8.2 Show login prompt for unauthenticated users
- [x] 8.3 Fetch drill queue from `GET /api/openings/drill/queue`; render queue list with empty-state CTA
- [x] 8.4 Implement drill session: show opening name, play correct moves one-by-one; wrong move = red flash + reset to pre-wrong position
- [x] 8.5 After all moves completed, show grading buttons: "Again" / "Hard" / "Good" / "Easy"
- [x] 8.6 On grade submit, call `POST /api/openings/{id}/review` then advance to next opening in queue
- [x] 8.7 Show "Queue complete" state when no more due openings remain

## 9. Frontend — Comments

- [x] 9.1 Create `src/features/openings/OpeningComment.tsx` — opening-level comment widget (add/edit/delete)
- [x] 9.2 Create `src/features/openings/PositionComment.tsx` — move-level 💬 icon + inline textarea
- [x] 9.3 Integrate `OpeningComment` into Browse detail panel and Drill UI
- [x] 9.4 Integrate `PositionComment` icons into `MoveList` rows (shown when an opening is selected)
- [x] 9.5 Wire comment components to API hooks (TanStack Query mutations for create/update/delete)
- [x] 9.6 Show comment inputs only to authenticated users; hide entirely for unauthenticated
