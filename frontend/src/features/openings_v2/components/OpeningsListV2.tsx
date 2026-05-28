import { useState, useMemo } from 'react'
import { OpeningsListHeader } from './OpeningsList/OpeningsListHeader'
import { OpeningsListSearchBar } from './OpeningsList/OpeningsListSearchBar'
import { OpeningsListEntry } from './OpeningsList/OpeningsListEntry'
import { useOpeningsStore } from '../store/openingsStore'
import { useChessBoardStore } from '../../../components/ChessBoardV2/store/chessBoardStore'

type ViewMode = 'list' | 'name' | 'move'

export function OpeningsListV2() {
  const [viewMode, setViewMode] = useState<ViewMode>('name')
  const [search, setSearch] = useState('')
  const openings = useOpeningsStore(s => s.openings)

  const playedMovesKey = useChessBoardStore(s =>
    s.history.slice(0, s.currentMoveIndex + 1).map(e => e.san).join(',')
  )

  const displayed = useMemo(() => {
    const playedMoves = playedMovesKey ? playedMovesKey.split(',') : []
    return openings.filter(o =>
      playedMoves.every((san, i) => o.moves[i] === san) &&
      (!search || o.name.toLowerCase().includes(search.toLowerCase()))
    )
  }, [openings, search, playedMovesKey])

  return (
    <div className="flex flex-col h-full">
      <OpeningsListHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      <OpeningsListSearchBar value={search} onChange={setSearch} />
      <OpeningsListEntry viewMode={viewMode} openings={displayed} />
    </div>
  )
}
