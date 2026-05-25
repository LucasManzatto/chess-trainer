import { useState, useMemo, useEffect } from 'react'
import type React from 'react'
import type { Opening } from '../../types'
import { collectOpeningIds, getFavoriteRatio } from '../../utils/treeUtils'

export type NameNode = {
  label: string
  opening: Opening | null
  children: NameNode[]
}

function parseNamePath(name: string): string[] {
  const colonIdx = name.indexOf(': ')
  if (colonIdx === -1) return [name]
  const main = name.slice(0, colonIdx)
  const rest = name.slice(colonIdx + 2)
  const commaIdx = rest.indexOf(', ')
  if (commaIdx === -1) return [main, rest]
  return [main, rest.slice(0, commaIdx), rest.slice(commaIdx + 2)]
}

function buildNameTree(openings: Opening[]): NameNode[] {
  type BuildNode = NameNode & { _m: Map<string, BuildNode> }
  const rootList: BuildNode[] = []
  const rootMap = new Map<string, BuildNode>()

  for (const opening of openings) {
    const path = parseNamePath(opening.name)
    let list = rootList as BuildNode[]
    let map = rootMap

    for (let i = 0; i < path.length; i++) {
      const label = path[i]
      if (!map.has(label)) {
        const node: BuildNode = { label, opening: null, children: [], _m: new Map() }
        map.set(label, node)
        list.push(node)
      }
      const node = map.get(label)!
      if (i === path.length - 1) node.opening = opening
      list = node.children as BuildNode[]
      map = node._m
    }
  }

  return rootList
}

const nameOpenings = (n: NameNode) => n.opening ? [n.opening] : []
const nameChildren = (n: NameNode) => n.children

export function collectDescendantIds(node: NameNode): number[] {
  return collectOpeningIds(node, nameOpenings, nameChildren)
}

export function getNameFavoriteRatio(node: NameNode, favoriteIds: Set<number>): { count: number; total: number } {
  return getFavoriteRatio(node, favoriteIds, nameOpenings, nameChildren)
}

type UseNameTreeNodeProps = {
  node: NameNode
  path: string
  selectedId?: number
  expanded: Set<string>
  favoriteIds: Set<number>
  onToggle: (path: string) => void
  onSelect?: (o: Opening) => void
  onToggleFavorite: (id: number) => void
  onBulkToggle: (ids: number[]) => void
}

export function useNameTreeNode({
  node, path, selectedId, expanded, favoriteIds,
  onToggle, onSelect, onToggleFavorite, onBulkToggle,
}: UseNameTreeNodeProps) {
  const isExpanded = expanded.has(path)
  const hasChildren = node.children.length > 0
  const isSelected = node.opening != null && selectedId === node.opening.id

  const starState = useMemo(() => {
    if (!hasChildren) {
      return node.opening ? (favoriteIds.has(node.opening.id) ? 'full' : 'empty') : 'empty'
    }
    const { count, total } = getNameFavoriteRatio(node, favoriteIds)
    if (total === 0) return 'empty'
    if (count === total) return 'full'
    if (count > 0) return 'partial'
    return 'empty'
  }, [node, hasChildren, favoriteIds])

  function handleStarClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (hasChildren) {
      onBulkToggle(collectDescendantIds(node))
    } else if (node.opening) {
      onToggleFavorite(node.opening.id)
    }
  }

  function handleClick() {
    if (hasChildren) onToggle(path)
    if (node.opening) onSelect?.(node.opening)
  }

  return { isExpanded, hasChildren, isSelected, starState, handleClick, handleStarClick }
}

export function useNameTree(openings: Opening[], selectedName?: string) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const roots = useMemo(() => buildNameTree(openings), [openings])

  useEffect(() => {
    if (!selectedName) return
    const segments = parseNamePath(selectedName)
    // Build ancestor paths (all but the leaf) to expand
    const toExpand: string[] = []
    for (let i = 0; i < segments.length - 1; i++) {
      toExpand.push(segments.slice(0, i + 1).join('/'))
    }
    if (toExpand.length === 0) return
    setExpanded(prev => {
      if (toExpand.every(p => prev.has(p))) return prev
      const next = new Set(prev)
      for (const p of toExpand) next.add(p)
      return next
    })
  }, [selectedName])

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return { roots, expanded, toggle }
}
