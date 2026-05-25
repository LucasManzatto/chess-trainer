import { useState, useMemo } from 'react'
import type React from 'react'
import type { Opening } from '../../types'
import { useOpeningTrie, type TrieNode } from '../../hooks/useOpeningTrie'
import { collectOpeningIds, getFavoriteRatio } from '../../utils/treeUtils'

const trieOpenings = (n: TrieNode) => n.openings
const trieChildren = (n: TrieNode) => [...n.children.values()]

export function collectTrieOpeningIds(node: TrieNode): number[] {
  return collectOpeningIds(node, trieOpenings, trieChildren)
}

export function getTrieFavoriteRatio(node: TrieNode, favoriteIds: Set<number>): { count: number; total: number } {
  return getFavoriteRatio(node, favoriteIds, trieOpenings, trieChildren)
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
