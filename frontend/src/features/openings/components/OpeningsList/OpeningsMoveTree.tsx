import { useState } from 'react'
import type { Opening } from '../../types'
import { useOpeningTrie, type TrieNode } from '../../hooks/useOpeningTrie'

type MoveNodeProps = {
  move: string
  node: TrieNode
  depth: number
  selectedId?: number
  expanded: Set<string>
  onToggle: (path: string) => void
  onSelect?: (o: Opening) => void
  path: string
}

function MoveTreeNode({ move, node, depth, selectedId, expanded, onToggle, onSelect, path }: MoveNodeProps) {
  const isExpanded = expanded.has(path)
  const hasChildren = node.children.size > 0

  return (
    <div>
      <button
        onClick={() => { if (hasChildren) onToggle(path) }}
        className="w-full text-left py-1 text-sm transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-300 border-l-2 border-transparent"
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '12px' }}
      >
        <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </span>
        <span className="font-mono text-xs text-gray-300">{move}</span>
        <span className="text-xs text-gray-600 ml-auto">{node.count}</span>
      </button>

      {isExpanded && (
        <div>
          {node.openings.map(opening => (
            <button
              key={opening.id}
              onClick={() => onSelect?.(opening)}
              className={`w-full text-left py-1 text-sm transition-colors flex items-center gap-2 min-w-0 ${
                selectedId === opening.id
                  ? 'border-l-2 border-amber-400 bg-amber-500/10 text-amber-200'
                  : 'border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              style={{ paddingLeft: `${8 + (depth + 1) * 12}px`, paddingRight: '12px' }}
            >
              <span className="text-xs font-mono text-amber-400/60 flex-shrink-0">{opening.eco}</span>
              <span className="truncate">{opening.name}</span>
            </button>
          ))}
          {Array.from(node.children.entries()).map(([childMove, childNode]) => (
            <MoveTreeNode
              key={childMove}
              move={childMove}
              node={childNode}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              path={`${path}/${childMove}`}
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

export function OpeningsMoveTree({ openings, selectedId, onSelect }: Props) {
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

  if (!trie) return null

  return (
    <div>
      {Array.from(trie.children.entries()).map(([move, node]) => (
        <MoveTreeNode
          key={move}
          move={move}
          node={node}
          depth={0}
          selectedId={selectedId}
          expanded={expanded}
          onToggle={toggle}
          onSelect={onSelect}
          path={move}
        />
      ))}
    </div>
  )
}
