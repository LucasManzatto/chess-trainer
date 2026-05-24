import { useState, useMemo } from 'react'
import type { Opening } from '../../types'

type NameNode = {
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

type NodeProps = {
  node: NameNode
  depth: number
  selectedId?: number
  expanded: Set<string>
  onToggle: (path: string) => void
  onSelect?: (o: Opening) => void
  path: string
}

function NameTreeNode({ node, depth, selectedId, expanded, onToggle, onSelect, path }: NodeProps) {
  const isExpanded = expanded.has(path)
  const hasChildren = node.children.length > 0
  const isSelected = node.opening != null && selectedId === node.opening.id

  function handleClick() {
    if (hasChildren) onToggle(path)
    if (node.opening) onSelect?.(node.opening)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left py-1 text-sm transition-colors flex items-center gap-1.5 min-w-0 ${
          isSelected
            ? 'border-l-2 border-amber-400 bg-amber-500/10 text-amber-200'
            : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '12px' }}
      >
        <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </span>
        <span className="truncate">{node.label}</span>
      </button>
      {isExpanded && (
        <div>
          {node.children.map(child => (
            <NameTreeNode
              key={child.label}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              path={`${path}/${child.label}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type Props = {
  openings: Opening[]
  selectedId?: number
  onSelect?: (o: Opening) => void
}

export function OpeningsNameTree({ openings, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const roots = useMemo(() => buildNameTree(openings), [openings])

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div>
      {roots.map(node => (
        <NameTreeNode
          key={node.label}
          node={node}
          depth={0}
          selectedId={selectedId}
          expanded={expanded}
          onToggle={toggle}
          onSelect={onSelect}
          path={node.label}
        />
      ))}
    </div>
  )
}
