import type { Opening } from '../../types'
import { useNameTree, useNameTreeNode, type NameNode } from './useNameTree'
import { ColorBadge, StarButton } from './OpeningsListPrimitives'

type NodeProps = {
  node: NameNode
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

function NameTreeNode({
  node, depth, selectedId, expanded, onToggle, onSelect,
  favoriteIds, onToggleFavorite, onBulkToggle, path,
}: NodeProps) {
  const { isExpanded, hasChildren, isSelected, starState, handleClick, handleStarClick } =
    useNameTreeNode({ node, path, selectedId, expanded, favoriteIds, onToggle, onSelect, onToggleFavorite, onBulkToggle })

  return (
    <div>
      <div
        className={`flex items-center min-w-0 ${
          isSelected
            ? 'border-l-2 border-amber-400 bg-amber-500/10'
            : 'border-l-2 border-transparent hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
      >
        <button
          onClick={handleClick}
          className={`flex-1 text-left py-1 text-sm transition-colors flex items-center gap-1.5 min-w-0 ${
            isSelected ? 'text-amber-200' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="text-gray-600 flex-shrink-0 w-3 text-xs">
            {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
          </span>
          {node.opening && <ColorBadge opening={node.opening} />}
          <span className="truncate">{node.label}</span>
        </button>
        <StarButton state={starState} onClick={handleStarClick} />
      </div>
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
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onBulkToggle={onBulkToggle}
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
  selectedName?: string
  onSelect?: (o: Opening) => void
  favoriteIds: Set<number>
  onToggleFavorite: (id: number) => void
  onBulkToggle: (ids: number[]) => void
}

export function OpeningsNameTree({ openings, selectedId, selectedName, onSelect, favoriteIds, onToggleFavorite, onBulkToggle }: Props) {
  const { roots, expanded, toggle } = useNameTree(openings, selectedName)

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
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onBulkToggle={onBulkToggle}
          path={node.label}
        />
      ))}
    </div>
  )
}
