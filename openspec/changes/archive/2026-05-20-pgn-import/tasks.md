## 1. Extend useGameHistory

- [x] 1.1 Add `GameMetadata` type (`white?`, `black?`, `event?`, `date?` — all `string | undefined`) and `gameMetadata: GameMetadata | null` state to `useGameHistory`
- [x] 1.2 Implement `loadFromPgn(pgn: string): { ok: true } | { ok: false; error: string }` — use `new Chess()`, wrap `chess.loadPgn(pgn)` in try/catch, extract `history({ verbose: true })` to build `MoveResult[]` (fields: `san`, `from`, `to`, `fen` = move.after), set `moves`, set `viewIndex` to `moves.length - 1`, set `gameMetadata` from `chess.header()`
- [x] 1.3 Return `loadFromPgn` and `gameMetadata` from the hook

## 2. Create PgnImportPanel component

- [x] 2.1 Create `frontend/src/components/PgnImport/PgnImportPanel.tsx` with props: `onImport: (pgn: string) => { ok: true } | { ok: false; error: string }`, `onClose: () => void`
- [x] 2.2 Component renders: textarea (placeholder: "Paste PGN here…"), "Import" button, inline error `<p>` (shown only when error exists)
- [x] 2.3 On submit: call `onImport(pgnText)`; if `ok: true` call `onClose()`; if `ok: false` show `error` message below textarea

## 3. Add import toggle and metadata display to the free-play page

- [x] 3.1 Add `showImport` boolean state to `routes/index.tsx`; add "Import PGN" toggle button above or beside the move list panel
- [x] 3.2 Render `<PgnImportPanel>` when `showImport` is true, wired to `loadFromPgn` and `() => setShowImport(false)`
- [x] 3.3 When `gameMetadata` is non-null, render a metadata header above `<MoveList>` showing White vs Black (and Event/Date if present)

## 4. Verify

- [x] 4.1 `npm run build` — no TypeScript errors
- [x] 4.2 Paste a valid PGN (e.g., a short Ruy Lopez game) — board shows final position, all moves in list, last move highlighted, metadata header visible, panel closed
- [x] 4.3 Submit empty/invalid PGN — inline error shown, panel stays open, board unchanged
- [x] 4.4 Arrow key navigation through imported game works; keyboard nav spec unchanged
