export function collectOpeningIds<T>(
  node: T,
  getOpenings: (n: T) => { id: number }[],
  getChildren: (n: T) => T[],
): number[] {
  const ids: number[] = []
  function walk(n: T) {
    for (const o of getOpenings(n)) ids.push(o.id)
    for (const child of getChildren(n)) walk(child)
  }
  walk(node)
  return ids
}

export function getFavoriteRatio<T>(
  node: T,
  favoriteIds: Set<number>,
  getOpenings: (n: T) => { id: number }[],
  getChildren: (n: T) => T[],
): { count: number; total: number } {
  let count = 0
  let total = 0
  function walk(n: T) {
    for (const o of getOpenings(n)) {
      total++
      if (favoriteIds.has(o.id)) count++
    }
    for (const child of getChildren(n)) walk(child)
  }
  walk(node)
  return { count, total }
}
