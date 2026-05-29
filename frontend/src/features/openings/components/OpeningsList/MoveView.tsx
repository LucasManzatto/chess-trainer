import { useState, useMemo, useCallback } from 'react'
import { useOpeningsStore, getSelectedOpening } from '../../store/openingsStore'
import type { Opening } from '../../types'
import { useExpandToSelection } from '../../hooks/useExpandToSelection'

function getMovesPaths(opening: Opening): string[] {
  const paths: string[] = []
  let current = ''
  for (const move of opening.moves) {
    current = current ? `${current}/${move}` : move
    paths.push(current)
  }
  return paths
}

// Each node in the trie represents one move. Openings whose move sequence ends here
// are stored in `openings`; further moves branch into `children`.
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

type NodeProps = {
  move: string
  node: TrieNode
  depth: number
  path: string
  expanded: Set<string>
  onToggle: (path: string) => void
  selectedId?: number
  onSelect: (o: Opening) => void
}

function MoveTreeNode({ move, node, depth, path, expanded, onToggle, selectedId, onSelect }: NodeProps) {
  const hasChildren = node.children.size > 0
  const isExpanded = expanded.has(path)

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        className="w-full text-left py-1 text-sm transition-colors flex items-center gap-1.5 border-l-2 border-transparent text-white/35 hover:bg-white/[0.07] hover:text-white/70"
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
      >
        <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </span>
        <span className="font-mono text-xs text-white/65">{move}</span>
        <span className="text-xs text-white/20 ml-auto pr-2">{node.count}</span>
      </button>

      {isExpanded && (
        <div>
          {node.openings.map(opening => (
            <button
              key={opening.id}
              onClick={() => onSelect(opening)}
              className={`w-full text-left py-1 text-sm transition-colors flex items-center gap-2 min-w-0 ${
                selectedId === opening.id
                  ? 'border-l-2 border-amber-400/70 bg-amber-500/10 text-white/90'
                  : 'border-l-2 border-transparent text-white/45 hover:bg-white/[0.07] hover:text-white/80'
              }`}
              style={{ paddingLeft: `${8 + (depth + 1) * 12}px`, paddingRight: '8px' }}
            >
              <span className="text-xs font-mono text-amber-400/50 flex-shrink-0">{opening.eco}</span>
              <span className="truncate">{opening.name}</span>
            </button>
          ))}
          {Array.from(node.children.entries()).map(([childMove, childNode]) => (
            <MoveTreeNode
              key={childMove}
              move={childMove}
              node={childNode}
              depth={depth + 1}
              path={`${path}/${childMove}`}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MoveViewProps {
  openings: Opening[]
}

export function MoveView({ openings }: MoveViewProps) {
  const selectedOpening = useOpeningsStore(getSelectedOpening)
  const setSelectedOpening = useOpeningsStore(s => s.setSelectedOpening)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const trie = useMemo(() => buildTrie(openings), [openings])

  useExpandToSelection(selectedOpening, setExpanded, getMovesPaths)

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
      {Array.from(trie.children.entries()).map(([move, node]) => (
        <MoveTreeNode
          key={move}
          move={move}
          node={node}
          depth={0}
          path={move}
          expanded={expanded}
          onToggle={toggle}
          selectedId={selectedOpening?.id}
          onSelect={setSelectedOpening}
        />
      ))}
    </div>
  )
}
