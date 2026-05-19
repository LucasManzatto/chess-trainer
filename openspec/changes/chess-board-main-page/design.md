## Context

React 19 + TypeScript + Vite frontend. No chess logic or UI exists yet. The `ChessBoard` component is the foundational building block — every future screen (puzzles, analysis, game history) will embed it. Getting its public API right now avoids breaking changes later.

## Goals / Non-Goals

**Goals:**
- Playable chess board with legal-move enforcement
- Reusable `ChessBoard` component with a clean prop API for external state control
- Main page that centers the board with a minimal layout

**Non-Goals:**
- Clock, score tracking, or game history UI (future screens)
- Multiplayer or backend integration (future change)
- Custom piece themes or board color pickers (future enhancement)

## Decisions

### 1. Use `react-chessboard` + `chess.js`

`react-chessboard` provides an accessible, well-maintained SVG board with drag-and-drop, arrow drawing, and square highlighting. `chess.js` handles move validation, FEN parsing, and game-state queries. Together they cover 100% of what a chess trainer needs without building from scratch.

**Alternatives considered:**
- `chessground` (Lichess): Powerful but no React bindings, requires manual wiring and CSS import
- Custom SVG board: Full control but weeks of work for features `react-chessboard` ships out of the box

### 2. `ChessBoard` owns internal game state by default, exposes controlled mode via props

Default (uncontrolled): component manages its own `chess.js` instance and FEN. Callers get `onMove` callbacks.
Controlled: caller passes `position` (FEN string) and `onMove` — component becomes a pure renderer.

This matches the React controlled/uncontrolled pattern and lets future screens (puzzles) take over state when needed without a rewrite.

**Alternatives considered:**
- Always controlled: forces all callers to manage chess state, overkill for the main page
- Always uncontrolled: can't support puzzle/analysis screens that need to set positions programmatically

### 3. Component lives in `src/components/ChessBoard/`

Barrel export from `index.ts`. Styles co-located. Keeps the component self-contained for future extraction into a shared package.

## Risks / Trade-offs

- `react-chessboard` v4 API may differ from older community examples → Pin to exact version, read official docs
- Board sizing with CSS: `react-chessboard` uses a `boardWidth` prop (pixels) → Use a responsive wrapper that observes container width with `ResizeObserver`

## Migration Plan

1. Install deps
2. Implement `ChessBoard` component
3. Replace `App.tsx` content with `MainPage`
4. Delete unused Vite starter assets

No rollback needed — frontend-only, no deployed artifact yet.
