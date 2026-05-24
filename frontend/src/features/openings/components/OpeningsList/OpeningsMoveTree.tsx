import type { Opening } from '../../types'
import { type TrieNode } from '../../hooks/useOpeningTrie'
import { useMoveTree, useMoveTreeNode } from './useMoveTree'

type MoveNodeProps = {
  move: string
  node: TrieNode
  depth: number
  selectedId?: number
  expanded: Set<string>
  onToggle: (path: string) => void
  onSelect?: (o: Opening) => void
  favoriteIds: Set<number>
  onToggleFavorite: (id: number) => void
  onBulkToggle: (ids: number[]) => void
  path: string
}

function MoveTreeNode({
  move, node, depth, selectedId, expanded, onToggle, onSelect,
  favoriteIds, onToggleFavorite, onBulkToggle, path,
}: MoveNodeProps) {
  const { isExpanded, hasChildren, starState, handleBulkStar, handleToggle } =
    useMoveTreeNode({ node, path, expanded, favoriteIds, onToggle, onBulkToggle })

  return (
    <div>
      <div
        className="flex items-center border-l-2 border-transparent hover:bg-white/5"
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
      >
        <button
          onClick={handleToggle}
          className="flex-1 text-left py-1 text-sm transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-300"
        >
          <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
            {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
          </span>
          <span className="font-mono text-xs text-gray-300">{move}</span>
          <span className="text-xs text-gray-600 ml-auto pr-2">{node.count}</span>
        </button>
        <button onClick={handleBulkStar as React.MouseEventHandler} className="flex-shrink-0 px-1 py-1">
          <span className={`text-xs ${
            starState === 'full' ? 'text-amber-400' :
            starState === 'partial' ? 'text-amber-400/40' :
            'text-gray-600 hover:text-gray-400'
          }`}>
            {starState === 'empty' ? '☆' : '★'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div>
          {node.openings.map(opening => (
            <div
              key={opening.id}
              className={`flex items-center min-w-0 ${
                selectedId === opening.id
                  ? 'border-l-2 border-amber-400 bg-amber-500/10'
                  : 'border-l-2 border-transparent hover:bg-white/5'
              }`}
              style={{ paddingLeft: `${8 + (depth + 1) * 12}px`, paddingRight: '8px' }}
            >
              <button
                onClick={() => onSelect?.(opening)}
                className={`flex-1 text-left py-1 text-sm transition-colors flex items-center gap-2 min-w-0 ${
                  selectedId === opening.id ? 'text-amber-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-mono text-amber-400/60 flex-shrink-0">{opening.eco}</span>
                <span className="truncate">{opening.name}</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite(opening.id) }}
                className="flex-shrink-0 px-1 py-1"
              >
                <span className={`text-xs ${favoriteIds.has(opening.id) ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}>
                  {favoriteIds.has(opening.id) ? '★' : '☆'}
                </span>
              </button>
            </div>
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
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onBulkToggle={onBulkToggle}
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
  favoriteIds: Set<number>
  onToggleFavorite: (id: number) => void
  onBulkToggle: (ids: number[]) => void
}

export function OpeningsMoveTree({ openings, selectedId, onSelect, favoriteIds, onToggleFavorite, onBulkToggle }: Props) {
  const { trie, expanded, toggle } = useMoveTree(openings)

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
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onBulkToggle={onBulkToggle}
          path={move}
        />
      ))}
    </div>
  )
}
