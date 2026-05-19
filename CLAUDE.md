# Chess Trainer — Claude Guidelines

## React Philosophies

Condensed principles to apply when writing React code in this project.

### 1. The Bare Minimum

- Enable `eslint-plugin-react-hooks` rules: `rules-of-hooks` + `exhaustive-deps`. Fix all warnings.
- Be honest about `useEffect`/`useMemo`/`useCallback` dependencies — don't lie to the linter.
- Always add `key` props in `.map()` renders.
- Only call hooks at the top level — never inside loops, conditions, or nested functions.
- Add error boundaries at multiple levels to prevent white-screen crashes.
- YAGNI: don't add dependencies or abstractions until they're actually needed.
- Leave code better than you found it: add `TODO`/`FIXME` comments when you spot a smell you can't fix immediately.

### 2. Design for Happiness

- **No redundant state.** Derive values from existing state during render instead of syncing with effects.
  ```tsx
  // Bad: three useState + useEffect chain to compute area/perimeter
  // Good: const area = computeArea(a, b) directly in render
  ```
- **Pass primitives as props**, not whole objects. Components should only know what they need.
  ```tsx
  // Bad: <Summary member={member} />
  // Good: <Summary imgUrl={...} webUrl={...} header={...} />
  ```
- **Single responsibility.** If you need "and" or "or" to describe a component, split it.
- **No premature abstraction.** Duplication is cheaper than the wrong abstraction. Wait until the pattern is clear.
- Avoid prop drilling with composition, not just Context. Context is not the default solution for state sharing.
- Split large `useEffect`s into smaller independent ones.
- Extract logic into custom hooks and helper functions.
- Prefer primitives as `useCallback`/`useMemo`/`useEffect` dependencies — fewer deps, fewer surprises.
- Use `useReducer` when multiple state values depend on each other.
- Place Context as low in the tree as possible, not globally unless necessary.

### 3. Performance

- Prove slowness with the React DevTools profiler before optimizing.
- `useMemo` only for genuinely expensive calculations. `useCallback` only when the reference stability matters downstream.
- `React.memo`/`useMemo`/`useCallback` with many or object dependencies often don't help — verify empirically.
- Fix slow renders before fixing re-renders.
- Colocate state close to where it's used — simpler code AND faster app.
- Logically split Contexts: one Context changing rerenders all consumers, even those not using that value.
- Lazy-load routes and heavy components; window large lists.

### 4. Testing

- Tests should resemble how users actually use the software.
- Don't test implementation details — test behavior.
- Aim for ~70% coverage on the frontend; beyond that, diminishing returns.
- Rarely need to change tests when refactoring = tests are correct.
- Prefer integration tests over unit tests for UI.
