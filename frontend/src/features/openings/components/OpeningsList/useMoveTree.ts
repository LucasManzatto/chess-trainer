import { useState, useMemo } from 'react'
import type React from 'react'
import type { Opening } from '../../types'
import { useOpeningTrie, type TrieNode } from '../../hooks/useOpeningTrie'

export function collectTrieOpeningIds(node: TrieNode): number[] {
  const ids: number[] = []
  function walk(n: TrieNode) {
    for (const o of n.openings) ids.push(o.id)
    for (const child of n.children.values()) walk(child)
  }
  walk(node)
  return ids
}

export function getTrieFavoriteRatio(node: TrieNode, favoriteIds: Set<number>): { count: number; total: number } {
  let count = 0
  let total = 0
  function walk(n: TrieNode) {
    for (const o of n.openings) { total++; if (favoriteIds.has(o.id)) count++ }
    for (const child of n.children.values()) walk(child)
  }
  walk(node)
  return { count, total }
}

type UseMoveTreeNodeProps = {
  node: TrieNode
  path: string
  expanded: Set<string>
  favoriteIds: Set<number>
  onToggle: (path: string) => void
  onBulkToggle: (ids: number[]) => void
}

export function useMoveTreeNode({
  node, path, expanded, favoriteIds, onToggle, onBulkToggle,
}: UseMoveTreeNodeProps) {
  const isExpanded = expanded.has(path)
  const hasChildren = node.children.size > 0

  const starState = useMemo(() => {
    const { count, total } = getTrieFavoriteRatio(node, favoriteIds)
    if (total === 0) return 'empty'
    if (count === total) return 'full'
    if (count > 0) return 'partial'
    return 'empty'
  }, [node, favoriteIds])

  function handleBulkStar(e: React.MouseEvent) {
    e.stopPropagation()
    onBulkToggle(collectTrieOpeningIds(node))
  }

  function handleToggle() {
    if (hasChildren) onToggle(path)
  }

  return { isExpanded, hasChildren, starState, handleBulkStar, handleToggle }
}

export function useMoveTree(openings: Opening[]) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const trie = useOpeningTrie(openings)

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return { trie, expanded, toggle }
}
