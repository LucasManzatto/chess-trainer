import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import type { MoveResult } from '../components/ChessBoard'

export type GameMetadata = {
  white?: string
  black?: string
  event?: string
  date?: string
}

export function useGameHistory() {
  const [moves, setMoves] = useState<MoveResult[]>([])
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null)

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

  function loadFromPgn(pgn: string): { ok: true } | { ok: false; error: string } {
    if (!pgn.trim()) return { ok: false, error: 'PGN is empty.' }
    try {
      const chess = new Chess()
      chess.loadPgn(pgn)
      const history = chess.history({ verbose: true })
      if (history.length === 0) return { ok: false, error: 'PGN contains no moves.' }
      const parsed: MoveResult[] = history.map(m => ({
        san: m.san,
        from: m.from,
        to: m.to,
        fen: m.after,
      }))
      const headers = chess.header()
      setMoves(parsed)
      setViewIndex(parsed.length - 1)
      setGameMetadata({
        white: headers['White'] ?? undefined,
        black: headers['Black'] ?? undefined,
        event: headers['Event'] ?? undefined,
        date: headers['Date'] ?? undefined,
      })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid PGN.' }
    }
  }

  const position = viewIndex !== null ? moves[viewIndex]?.fen : moves.at(-1)?.fen
  const interactive = viewIndex === null
  const selectedIndex = viewIndex ?? moves.length - 1

  return { moves, handleMove, handleMoveClick, loadFromPgn, gameMetadata, position, interactive, selectedIndex }
}
