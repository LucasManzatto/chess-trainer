import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Opening } from '../../types'
import { useFavorites } from '../../hooks/useFavorites'
import { OpeningsNameTree } from './OpeningsNameTree'
import { OpeningsMoveTree } from './OpeningsMoveTree'
import { useOpenings } from '../../hooks/useOpenings'
import { useChessGame } from '../../../../components/ChessBoard/hooks/useChessGame'
import { useBrowseOpeningContext } from '../BrowseTab/useBrowseOpeningContext'
import { OpeningsListHeader } from './OpeningsListHeader'
import { OpeningsListFilter } from './OpeningsListFilter'
import { OpeningsListRow } from './OpeningsListRow'
import type { ViewMode } from './useOpeningsList'

export function OpeningsList() {
  const { data: openingsData, isLoading } = useOpenings()
  const { currentMoves, loadMoves, currentMoveIndex } = useChessGame()
  const context = useBrowseOpeningContext(openingsData, currentMoves)
  const navigate = useNavigate()
  const { openingId } = useSearch({ from: '/openings/browse' })
  const autoSelectedRef = useRef<number | null>(null)

  useEffect(() => {
    if (!openingId || !openingsData || autoSelectedRef.current === openingId) return
    const target = openingsData.find(o => o.id === openingId)
    if (!target) return
    autoSelectedRef.current = openingId
    loadMoves(target.moves)
  }, [openingId, openingsData])

  function onSelect(o: Opening) {
    loadMoves(o.moves)
    navigate({ from: '/openings/browse', to: '/openings/browse', search: (prev) => ({ ...prev, openingId: o.id }), replace: true })
  }

  const selectedId = context.exactMatch?.id ?? context.selected?.id
  const selectedName = context.selected?.name

  const allOpenings = useMemo(() => {
    const base = currentMoveIndex >= 0 && context.matchingOpenings.length > 0
      ? context.matchingOpenings
      : (openingsData ?? [])
    return base
  }, [openingsData, context.matchingOpenings, currentMoveIndex])

  const [viewMode, setViewMode] = useState<ViewMode>('name')
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { ids: favoriteIds, toggleFavorite, bulkToggle } = useFavorites()

  const openings = useMemo(
    () => search ? allOpenings.filter(o => o.name.toLowerCase().includes(search.toLowerCase())) : allOpenings,
    [allOpenings, search],
  )

  const displayed = useMemo(() => {
    if (!showFavoritesOnly) return openings
    return openings.filter(o => favoriteIds.has(o.id))
  }, [openings, showFavoritesOnly, favoriteIds])

  return (
    <>
      <div className="border-b border-white/[0.06]">
        <OpeningsListHeader
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly(v => !v)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <OpeningsListFilter search={search} onSearchChange={setSearch} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-gray-500 text-sm p-3">Loading openings…</p>
        ) : displayed.length === 0 ? (
          <p className="text-gray-500 text-sm p-3">No openings found</p>
        ) : (
          <>
            {viewMode === 'list' && (
              <div className="py-1">
                {displayed.map(o => (
                  <OpeningsListRow
                    key={o.id}
                    opening={o}
                    isSelected={selectedId === o.id}
                    isFavorite={favoriteIds.has(o.id)}
                    onSelect={onSelect}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
            {viewMode === 'name' && (
              <OpeningsNameTree
                openings={displayed}
                selectedId={selectedId}
                selectedName={selectedName}
                onSelect={onSelect}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onBulkToggle={bulkToggle}
              />
            )}
            {viewMode === 'move' && (
              <OpeningsMoveTree
                openings={displayed}
                selectedId={selectedId}
                onSelect={onSelect}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onBulkToggle={bulkToggle}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}
