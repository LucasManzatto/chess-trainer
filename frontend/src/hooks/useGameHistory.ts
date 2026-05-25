import { useCallback, useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { useChessGame } from '../components/ChessBoard/hooks/useChessGame'

export type GameMetadata = {
  white?: string
  black?: string
  event?: string
  date?: string
}

type UseGameHistoryOptions = {
  interactiveAtEnd?: boolean
  orientation?: 'white' | 'black'
}

export function useGameHistory({ interactiveAtEnd = false, orientation = 'white' }: UseGameHistoryOptions = {}) {
  const board = useChessGame({ interactiveAtEnd, orientation })
  const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') board.navigateToIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [board.navigateToIndex])

  const handleMoveClick = useCallback((index: number | null) => {
    board.navigateToIndex(index)
  }, [board.navigateToIndex])

  const loadFromPgn = useCallback((pgn: string): { ok: true } | { ok: false; error: string } => {
    if (!pgn.trim()) return { ok: false, error: 'PGN is empty.' }
    try {
      const chess = new Chess()
      chess.loadPgn(pgn)
      const history = chess.history({ verbose: true })
      if (history.length === 0) return { ok: false, error: 'PGN contains no moves.' }
      const headers = chess.header()
      board.loadMoves(history.map(m => m.san))
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
  }, [board.loadMoves])

  return {
    config: board.config,
    allMoves: board.allMoves,
    currentMoveIndex: board.currentMoveIndex,
    boardFen: board.boardFen,
    lastMoveSquares: board.lastMoveSquares,
    loadFromPgn,
    gameMetadata,
    handleMoveClick,
  }
}
