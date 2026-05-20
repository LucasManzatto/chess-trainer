## 1. Extract MoveToken component

- [ ] 1.1 Add `MoveToken` function component inside `MoveList.tsx` accepting `san`, `index`, `selectedIndex`, `onClick` props
- [ ] 1.2 Replace white button JSX with `<MoveToken san={white} index={whiteIndex} ... />`
- [ ] 1.3 Replace black button JSX (inside the `black !== undefined` guard) with `<MoveToken san={black} index={blackIndex} ... />`

## 2. Fix scroll-to-selected

- [ ] 2.1 Create a ref array (`useRef<(HTMLButtonElement | null)[]>([])`) to hold refs for each move token
- [ ] 2.2 Pass a `ref` callback to `MoveToken` so each button registers itself in the ref array by index
- [ ] 2.3 Add a second `useEffect` on `[selectedIndex]` that calls `tokenRefs.current[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` when `selectedIndex` is not null

## 3. Fix key stability

- [ ] 3.1 Replace `key={pairIndex}` on `<tr>` with `key={`${pairIndex}-${white}`}`

## 4. Verify

- [x] 4.1 TypeScript compiles with no errors (`npm run build`)
- [x] 4.2 Manual smoke test: play 15+ moves, navigate back with arrow keys — selected move scrolls into view; forward navigation also keeps selected visible
- [x] 4.3 Check live play still auto-scrolls to newest move
