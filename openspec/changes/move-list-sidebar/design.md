## Context

Current state: `App.tsx` renders a single centered `<ChessBoard />` with no surrounding context. `ChessBoard` owns its game state internally. Move history is not surfaced anywhere.

This change introduces a sidebar panel and requires two things: (1) lifting move state from `ChessBoard` up to `App` so both board and move list share the same source of truth, and (2) switching the page layout to two columns.

Tailwind CSS v4 is not yet installed — this change installs and wires it up, replacing the manual CSS approach used so far.

## Goals / Non-Goals

**Goals:**
- `MoveList` component renders algebraic notation pairs, auto-scrolls to latest
- Two-column layout: board left, move list right, responsive stack on mobile
- Tailwind v4 installed and configured

**Non-Goals:**
- Click-to-jump to a past position (future: game analysis)
- Move annotations or comments
- Export/share game (future change)
- Undo/redo controls

## Decisions

### 1. Lift move state to `App`, keep `ChessBoard` uncontrolled

`ChessBoard` stays internally stateful (owns `chess.js` instance). `App` listens via `onMove` callback and accumulates a `moves: MoveResult[]` array in `useState`. `MoveList` receives this array as a prop.

**Alternative considered:** Move chess state fully up to `App` and use `ChessBoard` in controlled mode. Overkill here — controlled mode is for analysis/puzzle screens where the parent needs to set positions programmatically. For free play, `onMove` is sufficient.

### 2. Move notation from `chess.js` via `move.san`

`chess.js` `move()` returns the move object with a `san` field (Standard Algebraic Notation, e.g. `e4`, `Nf3`, `O-O`). Pass `san` through `MoveResult` so `MoveList` never re-derives notation.

**Impact:** `MoveResult` type gains a `san: string` field. `ChessBoard.tsx` updated to include it.

### 3. Tailwind v4 via `@tailwindcss/vite` plugin

Tailwind v4 uses CSS-first config (no `tailwind.config.js`). Add `@import "tailwindcss"` to `index.css`, register the Vite plugin. Existing hand-written CSS in `App.css` / `index.css` stays valid — no conflict.

**Alternative:** Keep plain CSS. Rejected because the project config explicitly targets Tailwind v4 as the styling system.

### 4. `MoveList` in `src/components/` not `src/features/`

`MoveList` is a pure display component with no feature-level concerns (no API calls, no router integration). Feature-sliced structure reserves `features/` for domain features with their own state/queries. A stateless UI component belongs in `components/`.

## Risks / Trade-offs

- `MoveResult.san` addition is a **breaking type change** to `ChessBoard`'s public API — mitigated since only `App.tsx` consumes `onMove` today.
- Tailwind v4 CSS-first config differs from v3 docs that most AI training data knows — write config carefully per v4 spec.

## Migration Plan

1. Install Tailwind dependencies, add Vite plugin
2. Add `@import "tailwindcss"` to `index.css`
3. Update `MoveResult` type + `ChessBoard` to emit `san`
4. Implement `MoveList` component
5. Update `App.tsx` layout (two columns) and wire `onMove` → move list state
6. Replace `App.css` layout with Tailwind classes
