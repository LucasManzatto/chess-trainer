import { useCallback, useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import type { MoveResult } from '../components/ChessBoard/ChessBoard'
import { useArrowKeyNavigation } from './useArrowKeyNavigation'

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useArrowKeyNavigation(
    () => {
      if (moves.length === 0) return
      setViewIndex(v => v === null ? Math.max(0, moves.length - 2) : Math.max(0, v - 1))
    },
    () => {
      if (moves.length === 0) return
      setViewIndex(v => {
        if (v === null) return null
        const next = v + 1
        return next >= moves.length - 1 ? null : next
      })
    },
  )

  const handleMove = useCallback((move: MoveResult) => {
    setMoves(prev => [...prev, move])
  }, [])

  const handleMoveClick = useCallback((index: number | null) => {
    if (index === null) { setViewIndex(null); return }
    setViewIndex(index === moves.length - 1 ? null : index)
  }, [moves])

  const loadFromPgn = useCallback((pgn: string): { ok: true } | { ok: false; error: string } => {
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
  }, [])

  const position = viewIndex !== null ? moves[viewIndex]?.fen : moves.at(-1)?.fen
  const interactive = viewIndex === null
  const selectedIndex = viewIndex ?? moves.length - 1

  return { moves, handleMove, handleMoveClick, loadFromPgn, gameMetadata, position, interactive, selectedIndex }
}
