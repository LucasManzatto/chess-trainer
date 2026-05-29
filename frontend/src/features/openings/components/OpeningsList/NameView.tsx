import { useState, useMemo, useCallback } from 'react'
import { useOpeningsStore } from '../../store/openingsStore'
import type { Opening } from '../../types'

type NameNode = {
  label: string
  opening: Opening | null
  children: NameNode[]
}

// Opening names follow "Main: Variation, Sub-variation" — split into up to N path segments.
function parseNamePath(name: string): string[] {
  const colonIdx = name.indexOf(': ')
  if (colonIdx === -1) return [name]
  const main = name.slice(0, colonIdx)
  const rest = name.slice(colonIdx + 2) // skip ': ' (2 chars)
  return [main, ...rest.split(', ')]
}

function buildNameTree(openings: Opening[]): NameNode[] {
  // _m is a per-node child lookup map used only during construction; stripped from the return type.
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

type NodeProps = {
  node: NameNode
  depth: number
  path: string
  expanded: Set<string>
  onToggle: (path: string) => void
  selectedId?: number
  onSelect: (o: Opening) => void
}

function NameTreeNode({ node, depth, path, expanded, onToggle, selectedId, onSelect }: NodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(path)
  const isSelected = node.opening != null && selectedId === node.opening.id

  function handleClick() {
    if (hasChildren) onToggle(path)
    // node.opening can exist on a parent node (intermediate + leaf) — both toggle and select fire
    if (node.opening) onSelect(node.opening)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left py-1 text-sm transition-colors flex items-center gap-1.5 min-w-0 ${
          isSelected
            ? 'border-l-2 border-amber-400/70 bg-amber-500/10 text-white/90'
            : 'border-l-2 border-transparent text-white/45 hover:bg-white/[0.07] hover:text-white/80'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
      >
        <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </span>
        <span className="truncate">{node.label}</span>
      </button>
      {isExpanded && node.children.map(child => (
        <NameTreeNode
          key={child.label + (child.opening?.id ?? '')}
          node={child}
          depth={depth + 1}
          path={`${path}/${child.label}`}
          expanded={expanded}
          onToggle={onToggle}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface NameViewProps {
  openings: Opening[]
}

export function NameView({ openings }: NameViewProps) {
  const selectedOpening = useOpeningsStore(s => s.selectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const roots = useMemo(() => buildNameTree(openings), [openings])

  const toggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  return (
    <div className="py-1">
      {roots.map(node => (
        <NameTreeNode
          key={node.label}
          node={node}
          depth={0}
          path={node.label}
          expanded={expanded}
          onToggle={toggle}
          selectedId={selectedOpening?.id}
          onSelect={setSelectedOpening}
        />
      ))}
    </div>
  )
}
