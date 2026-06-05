import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useOpeningsStore, getSelectedOpening } from '../../store/openingsStore'
import type { Opening } from '../../types'
import { FavoriteButton } from './FavoriteButton'

// --- Trie ---

type TrieNode = {
  children: Map<string, TrieNode>
  openings: Opening[]
  count: number
}

function buildTrie(openings: Opening[]): TrieNode {
  const root: TrieNode = { children: new Map(), openings: [], count: 0 }
  for (const opening of openings) {
    let node = root
    node.count++
    for (const move of opening.moves) {
      let child = node.children.get(move)
      if (!child) {
        child = { children: new Map(), openings: [], count: 0 }
        node.children.set(move, child)
      }
      child.count++
      node = child
    }
    node.openings.push(opening)
  }
  return root
}

type NamedChild = { node: TrieNode; path: string }

function collectNamedChildren(node: TrieNode, path: string): NamedChild[] {
  const result: NamedChild[] = []
  for (const [move, child] of node.children) {
    const childPath = `${path}/${move}`
    if (child.openings.length > 0) {
      result.push({ node: child, path: childPath })
    } else {
      result.push(...collectNamedChildren(child, childPath))
    }
  }
  return result.sort((a, b) => b.node.count - a.node.count)
}

function stripPrefix(name: string): string {
  const i = name.indexOf(': ')
  return i !== -1 ? name.slice(i + 2) : name
}

// --- Drill-down types ---

type DrillFrame = { node: TrieNode; path: string; label: string }
type ListItem = NamedChild & { hasChildren: boolean }

function findDrillStack(trie: TrieNode, opening: Opening): DrillFrame[] {
  const frames: DrillFrame[] = []
  let node = trie
  let path = ''

  for (const move of opening.moves) {
    const child = node.children.get(move)
    if (!child) break
    path = path ? `${path}/${move}` : move
    node = child

    if (node.openings.length > 0 && !node.openings.some(o => o.id === opening.id)) {
      frames.push({ node, path, label: stripPrefix(node.openings[0].name) })
    }
  }

  return frames
}

// --- Hooks ---

function useOpeningTrie(openings: Opening[]) {
  const trie = useMemo(() => buildTrie(openings), [openings])

  const roots = useMemo<NamedChild[]>(() => {
    const result: NamedChild[] = []
    for (const [move, node] of trie.children) {
      if (node.openings.length > 0) {
        result.push({ node, path: move })
      } else {
        result.push(...collectNamedChildren(node, move))
      }
    }
    return result.sort((a, b) => b.node.count - a.node.count)
  }, [trie])

  return { trie, roots }
}

function useDrillStack(
  trie: TrieNode,
  roots: NamedChild[],
  selectedOpening: Opening | null | undefined,
) {
  const [drillStack, setDrillStack] = useState<DrillFrame[]>([])
  const isUserDrillRef = useRef(false)

  const currentFrame = drillStack.length > 0 ? drillStack[drillStack.length - 1] : null

  const currentItems = useMemo<ListItem[]>(() => {
    const base = currentFrame
      ? collectNamedChildren(currentFrame.node, currentFrame.path)
      : roots
    return base.map(item => {
      const children = collectNamedChildren(item.node, item.path)
      return { ...item, hasChildren: children.length > 0 }
    })
  }, [currentFrame, roots])

  const currentNodeOpenings = useMemo(
    () => (currentFrame && currentFrame.node.openings.length > 1 ? currentFrame.node.openings : []),
    [currentFrame],
  )

  const drillInto = useCallback((item: NamedChild) => {
    isUserDrillRef.current = true
    const label = stripPrefix(item.node.openings[0]?.name ?? item.path)
    setDrillStack(prev => [...prev, { node: item.node, path: item.path, label }])
  }, [])

  const navigateTo = useCallback((index: number) => {
    setDrillStack(prev => (index < 0 ? [] : prev.slice(0, index + 1)))
  }, [])

  // Auto-navigate when selection changes from outside (board detection).
  // isUserDrillRef suppresses the effect when the user drilled explicitly —
  // both setSelectedOpening and setDrillStack are batched in the same event,
  // so the ref is still true when the effect fires.
  useEffect(() => {
    if (isUserDrillRef.current) {
      isUserDrillRef.current = false
      return
    }
    if (!selectedOpening) return
    setDrillStack(findDrillStack(trie, selectedOpening))
  }, [selectedOpening, trie])

  return { drillStack, currentItems, currentNodeOpenings, drillInto, navigateTo }
}

const noop = () => {}

// --- Sub-components ---

function Breadcrumb({
  stack,
  onNavigate,
}: {
  stack: DrillFrame[]
  onNavigate: (index: number) => void
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 px-2 py-1.5 text-xs border-b border-white/10 bg-zinc-950/95 backdrop-blur-sm flex-wrap">
      <button
        onClick={() => onNavigate(-1)}
        className="text-white/50 hover:text-white/80 transition-colors flex-shrink-0 pr-0.5"
        aria-label="Back to root"
      >
        ←
      </button>
      <button
        onClick={() => onNavigate(-1)}
        className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
      >
        All
      </button>
      {stack.map((frame, i) => (
        <span key={frame.path} className="flex items-center gap-1 min-w-0">
          <span className="text-white/20 flex-shrink-0">/</span>
          <button
            onClick={() => onNavigate(i)}
            className={`truncate max-w-[150px] transition-colors ${
              i === stack.length - 1
                ? 'text-white/70 pointer-events-none'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {frame.label}
          </button>
        </span>
      ))}
    </div>
  )
}

function DrillItem({
  opening,
  hasChildren,
  isSelected,
  onSelect,
  onDrill,
}: {
  opening: Opening
  hasChildren: boolean
  isSelected: boolean
  onSelect: (o: Opening) => void
  onDrill: () => void
}) {
  return (
    <div className="flex items-center group">
      <button
        onClick={() => {
          onSelect(opening)
          if (hasChildren) onDrill()
        }}
        className={`flex-1 min-w-0 text-left py-1.5 px-3 text-sm transition-colors flex items-center gap-2 ${
          isSelected
            ? 'border-l-2 border-amber-400/70 bg-amber-500/10 text-white/90'
            : 'border-l-2 border-transparent text-white/50 hover:bg-white/[0.07] hover:text-white/80'
        }`}
      >
        <span className="truncate flex-1">{stripPrefix(opening.name)}</span>
        {hasChildren && (
          <span className="text-white/25 flex-shrink-0 text-base leading-none">›</span>
        )}
      </button>
      <FavoriteButton openingId={opening.id} />
    </div>
  )
}

// --- Main component ---

interface ListViewProps {
  openings: Opening[]
}

export function ListView({ openings }: ListViewProps) {
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)

  const { trie, roots } = useOpeningTrie(openings)
  const { drillStack, currentItems, currentNodeOpenings, drillInto, navigateTo } =
    useDrillStack(trie, roots, selectedOpening)

  return (
    <div>
      {drillStack.length > 0 && (
        <Breadcrumb stack={drillStack} onNavigate={navigateTo} />
      )}
      <div className="py-1">
        {currentNodeOpenings.map(o => (
          <DrillItem
            key={o.id}
            opening={o}
            hasChildren={false}
            isSelected={selectedOpening?.id === o.id}
            onSelect={setSelectedOpening}
            onDrill={noop}
          />
        ))}
        {currentItems.flatMap(item =>
          item.node.openings.map(opening => (
            <DrillItem
              key={opening.id}
              opening={opening}
              hasChildren={item.hasChildren}
              isSelected={selectedOpening?.id === opening.id}
              onSelect={setSelectedOpening}
              onDrill={() => drillInto(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}
