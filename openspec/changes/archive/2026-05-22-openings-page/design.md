## Context

The `/openings` route is a placeholder. Building a full feature requires cross-cutting changes: a DB seeding pipeline, new FastAPI endpoints, and a multi-tab React feature. The existing `ChessBoard`, `MoveList`, and auth guard are reused unchanged.

## Goals / Non-Goals

**Goals:**
- Three functional tabs: Browse (search/filter), Explore (interactive trie), Drill (SM-2 SRS)
- 3,704 openings from lichess dataset seeded into Neon and served as static JSON
- Private per-user comments on openings and individual moves
- SM-2 spaced repetition with server-authoritative state

**Non-Goals:**
- Public or shared comments
- Repertoire builder (curating personal opening sets)
- Opening frequency statistics from real games
- ECO variant tree editing

## Decisions

### 1. Client-side data loading for Browse and Explore

**Decision:** Load all 3,704 openings as a lazy-loaded JSON chunk; Browse filtering and Explore trie run entirely in-browser.

**Rationale:** The full dataset is ~50 KB gzipped — negligible. Eliminates API round-trips for search and trie traversal, enabling instant response. Paginated server-side search would add backend complexity with no user-visible benefit at this scale.

**Alternative considered:** Paginated `/api/openings?search=...` endpoint — rejected. Adds infra cost for a 50 KB dataset.

---

### 2. Trie built at runtime, not pre-serialized

**Decision:** Build the Explore trie client-side in a `useMemo` from `moves[]` on first tab open.

**Rationale:** Building 3,704 entries takes ~10 ms in JS. Pre-serializing the trie in `openings.json` would bloat the file and add seeding complexity. The trie is cheap to rebuild.

**Trie structure:**
```ts
type TrieNode = {
  children: Map<string, TrieNode>  // keyed by SAN move
  openings: Opening[]              // openings that END at this node
  count: number                    // openings that PASS THROUGH this node
}
```

---

### 3. FEN computed server-side at seeding time

**Decision:** `python-chess` computes the final FEN for each PGN during seeding; stored in DB and included in `openings.json`.

**Rationale:** Avoids computing 3,704 FENs client-side on every page load (~100 ms). Board display is instant.

**Alternative considered:** Compute FEN client-side with `chess.js` — rejected due to startup cost.

---

### 4. SM-2 runs server-side

**Decision:** SM-2 calculation lives in the FastAPI `POST /api/openings/{id}/review` endpoint. The DB stores `ease_factor`, `interval_days`, `repetitions`, `due_date`.

**Rationale:** Server-authoritative state avoids drift if the algorithm changes. Client never needs to understand SM-2 math — it just sends a grade (0–5) and receives an updated schedule.

---

### 5. Two separate comment tables

**Decision:** `opening_comments` (whole-line annotations) and `position_comments` (move-level annotations) are separate tables.

**Rationale:** Different query patterns and different primary keys (opening_id vs opening_id + move_index). A unified table with nullable columns complicates queries.

---

### 6. Explore mode: ChessGround shapes for move highlights

**Decision:** Use ChessGround's `drawable.shapes` config to highlight candidate squares. Each shape is a circle on the destination square. Move count badges rendered as a custom overlay (absolute-positioned div keyed to square coordinates).

**Rationale:** ChessGround shapes support colors and opacity natively. Custom overlay gives full control over badge text/styling.

**Risk:** Coordinate mapping from algebraic square to pixel position requires knowing board orientation and size. Mitigated by computing from `boardWidth` and `orientation` props already available in `ChessBoard`.

---

### 7. Drill entry point

**Decision:** Drill tab shows a list of openings due for review. If a user has no progress records yet, the list is empty with a call-to-action prompting them to add openings from Browse.

**Rationale:** Auto-seeding a starter set for new users introduces unwanted openings into someone's drill queue. Better to let users consciously add openings to drill from Browse or Explore.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `python-chess` can't parse an unusual PGN | Log and skip during seeding; seed script reports failures |
| ChessGround shapes API changes in future upgrade | Shapes config is stable across v9/v10; isolate in a thin adapter |
| Drill queue empty on first visit | Clear empty-state UI with CTA: "Add openings to drill from Browse" |
| `openings.json` grows if dataset is updated | Re-run seed script; JSON is gitignored (generated artifact) |

## Migration Plan

1. Add `python-chess` to `backend/requirements.txt`
2. Run `python backend/scripts/seed_openings.py` — creates 4 DB tables and emits `frontend/public/openings.json`
3. Deploy backend with new `openings` router
4. Run `npm run gen:api` in frontend to regenerate typed API client
5. Deploy frontend
6. Rollback: remove the 4 DB tables; revert route to placeholder; drop `openings.json`

## Open Questions

- Should "Add to Drill" be available from Explore mode (when a named opening is identified), or Browse only? → Assume both for now; revisit in implementation.
- Should move count badges in Explore appear on hover or always-on? → Always-on; hover adds interaction complexity for little gain.
