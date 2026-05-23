import { useState, useMemo, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { useOpenings } from '../useOpenings'
import { useOpeningTrie, walkTrie, collectOpenings } from '../useOpeningTrie'
import type { Opening } from '../types'
import type { MoveResult } from '../../../components/ChessBoard/ChessBoard'

export function useExploreTab() {
  const { data: openings, isLoading } = useOpenings()
  const trie = useOpeningTrie(openings)

  const [moves, setMoves] = useState<string[]>([])
  const [fen, setFen] = useState<string | undefined>(undefined)

  const currentNode = useMemo(() => {
    if (!trie) return null
    return walkTrie(trie, moves)
  }, [trie, moves])

  const matchingOpenings = useMemo((): Opening[] => {
    if (!currentNode) return []
    return collectOpenings(currentNode)
  }, [currentNode])

  const exactMatch: Opening | null = currentNode?.openings[0] ?? null

  const candidateMoves = useMemo((): Map<string, number> => {
    if (!currentNode) return new Map()
    const result = new Map<string, number>()
    for (const [san, child] of currentNode.children.entries()) {
      result.set(san, child.count)
    }
    return result
  }, [currentNode])

  const highlightedSquares = useMemo((): Array<{ orig: Key; dest: Key; count: number }> => {
    const chess = fen ? new Chess(fen) : new Chess()
    const result: Array<{ orig: Key; dest: Key; count: number }> = []
    for (const [san, count] of candidateMoves.entries()) {
      const legal = chess.moves({ verbose: true }).find(m => m.san === san)
      if (legal) {
        result.push({ orig: legal.from as Key, dest: legal.to as Key, count })
      }
    }
    return result
  }, [candidateMoves, fen])

  const shapes: DrawShape[] = highlightedSquares.map(({ dest }) => ({ orig: dest, dest, brush: 'green' }))

  const noOpenings = moves.length > 0 && currentNode === null

  const handleMove = useCallback((move: MoveResult) => {
    setFen(move.fen)
    setMoves(prev => [...prev, move.san])
  }, [])

  function handleReset() {
    setMoves([])
    setFen(undefined)
  }

  function handleUndo() {
    if (moves.length === 0) return
    const newMoves = moves.slice(0, -1)
    setMoves(newMoves)
    if (newMoves.length === 0) {
      setFen(undefined)
    } else {
      const chess = new Chess()
      for (const m of newMoves) chess.move(m)
      setFen(chess.fen())
    }
  }

  return {
    isLoading,
    moves,
    fen,
    currentNode,
    matchingOpenings,
    exactMatch,
    candidateMoves,
    shapes,
    noOpenings,
    handleMove,
    handleReset,
    handleUndo,
  }
}
