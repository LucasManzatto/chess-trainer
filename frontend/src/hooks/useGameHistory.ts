import { useState, useEffect, useRef } from 'react'
import type { MoveResult } from '../components/ChessBoard'

export function useGameHistory() {
  const [moves, setMoves] = useState<MoveResult[]>([])
  const [viewIndex, setViewIndex] = useState<number | null>(null)

  const movesRef = useRef(moves)
  const viewIndexRef = useRef(viewIndex)
  useEffect(() => {
    movesRef.current = moves
    viewIndexRef.current = viewIndex
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const currentMoves = movesRef.current
      const currentView = viewIndexRef.current

      if (currentMoves.length === 0) return

      if (e.key === 'ArrowLeft') {
        if (currentView === null) {
          setViewIndex(Math.max(0, currentMoves.length - 2))
        } else {
          setViewIndex(Math.max(0, currentView - 1))
        }
      } else if (e.key === 'ArrowRight') {
        if (currentView === null) return
        const next = currentView + 1
        setViewIndex(next >= currentMoves.length - 1 ? null : next)
      } else if (e.key === 'Escape') {
        setViewIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleMove(move: MoveResult) {
    setMoves(prev => [...prev, move])
  }

  function handleMoveClick(index: number) {
    setViewIndex(index === moves.length - 1 ? null : index)
  }

  const position = viewIndex !== null ? moves[viewIndex]?.fen : moves.at(-1)?.fen
  const interactive = viewIndex === null
  const selectedIndex = viewIndex ?? moves.length - 1

  return { moves, handleMove, handleMoveClick, position, interactive, selectedIndex }
}
