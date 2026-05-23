import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import { useOpenings } from '../useOpenings'
import type { Opening } from '../types'
import type { EcoGroup } from '../OpeningsList/EcoFilter'

function computeMoveFens(moves: string[]): string[] {
  const chess = new Chess()
  return moves.map(m => { chess.move(m); return chess.fen() })
}

export function useBrowseTab() {
  const { data: openings, isLoading } = useOpenings()
  const [selected, setSelected] = useState<Opening | null>(null)
  const [ecoGroup, setEcoGroup] = useState<EcoGroup>('All')
  const [search, setSearch] = useState('')
  const [moveIndex, setMoveIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (!openings) return []
    return openings.filter(o => {
      const matchEco = ecoGroup === 'All' || o.eco.startsWith(ecoGroup)
      const matchSearch = o.name.toLowerCase().includes(search.toLowerCase())
      return matchEco && matchSearch
    })
  }, [openings, ecoGroup, search])

  const moveFens = useMemo(
    () => (selected ? computeMoveFens(selected.moves) : []),
    [selected],
  )

  const boardFen = moveIndex === null ? selected?.fen : moveFens[moveIndex]
  const currentMoveFen = moveIndex !== null ? moveFens[moveIndex] : undefined

  function selectOpening(o: Opening) {
    setSelected(o)
    setMoveIndex(null)
  }

  return {
    openings: filtered,
    isLoading,
    selected,
    ecoGroup,
    search,
    moveIndex,
    boardFen,
    currentMoveFen,
    setEcoGroup,
    setSearch,
    setMoveIndex,
    selectOpening,
  }
}
