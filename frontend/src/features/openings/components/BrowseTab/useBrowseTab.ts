import { useState, useMemo, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import type { Key } from '@lichess-org/chessground/types'
import type { DrawShape } from '@lichess-org/chessground/draw'
import { useOpenings } from '../../hooks/useOpenings'
import { useOpeningTrie, walkTrie, collectOpenings } from '../../hooks/useOpeningTrie'
import type { Opening } from '../../types'
import type { MoveResult } from '../../../../components/ChessBoard/ChessBoard'

function computeAllMovesData(moves: string[]): { fens: string[]; froms: string[]; tos: string[] } {
  const chess = new Chess()
  const fens: string[] = [], froms: string[] = [], tos: string[] = []
  for (const san of moves) {
    const move = chess.move(san)
    fens.push(chess.fen())
    froms.push(move.from)
    tos.push(move.to)
  }
  return { fens, froms, tos }
}

export function useBrowseTab() {
  const { data: openings, isLoading } = useOpenings()
  const trie = useOpeningTrie(openings)
  const [search, setSearch] = useState('')
  // Board state is source of truth
  const [allMoves, setAllMoves] = useState<string[]>([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1)

  const { fens: allMoveFens, froms: allFroms, tos: allTos } = useMemo(() => computeAllMovesData(allMoves), [allMoves])
  const boardFen = currentMoveIndex === -1 ? undefined : allMoveFens[currentMoveIndex]
  const lastMoveSquares: [Key, Key] | undefined = currentMoveIndex >= 0
    ? [allFroms[currentMoveIndex] as Key, allTos[currentMoveIndex] as Key]
    : undefined

  const currentMoves = useMemo(
    () => allMoves.slice(0, currentMoveIndex + 1),
    [allMoves, currentMoveIndex],
  )

  const currentNode = useMemo(() => {
    if (!trie) return null
    return walkTrie(trie, currentMoves)
  }, [trie, currentMoves])

  const matchingOpenings = useMemo((): Opening[] => {
    if (!currentNode) return []
    return collectOpenings(currentNode)
  }, [currentNode])

  // Derived: exact match first, else first matching opening for context
  const exactMatch: Opening | null = currentNode?.openings[0] ?? null
  const selected: Opening | null = exactMatch ?? matchingOpenings[0] ?? null

  const displayedOpenings = useMemo(() => {
    const base = currentMoveIndex >= 0 && matchingOpenings.length > 0
      ? matchingOpenings
      : (openings ?? [])
    return search
      ? base.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
      : base
  }, [openings, matchingOpenings, currentMoveIndex, search])

  const candidateMoves = useMemo((): Map<string, number> => {
    if (!currentNode) return new Map()
    const result = new Map<string, number>()
    for (const [san, child] of currentNode.children.entries()) {
      result.set(san, child.count)
    }
    return result
  }, [currentNode])

  const shapes = useMemo((): DrawShape[] => {
    if (candidateMoves.size === 0) return []
    const chess = boardFen ? new Chess(boardFen) : new Chess()
    const legal = chess.moves({ verbose: true })
    const result: DrawShape[] = []
    for (const [san] of candidateMoves.entries()) {
      const move = legal.find(m => m.san === san)
      if (move) result.push({ orig: move.from as Key, dest: move.to as Key, brush: 'green' })
    }
    return result
  }, [candidateMoves, boardFen])

  const handleMove = useCallback((move: MoveResult) => {
    setAllMoves(prev => [...prev.slice(0, currentMoveIndex + 1), move.san])
    setCurrentMoveIndex(prev => prev + 1)
  }, [currentMoveIndex])

  const navigateBack = useCallback(() => {
    setCurrentMoveIndex(prev => Math.max(-1, prev - 1))
  }, [])

  const navigateForward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.min(allMoves.length - 1, prev + 1))
  }, [allMoves.length])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigateBack() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigateForward() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateBack, navigateForward])

  // Clicking an opening sets board state — selection follows board, not vice-versa
  function handleOpeningSelect(o: Opening) {
    setAllMoves(o.moves)
    setCurrentMoveIndex(o.moves.length - 1)
  }

  function handleMoveListClick(index: number | null) {
    setCurrentMoveIndex(index === null ? allMoves.length - 1 : index)
  }

  function resetBoard() {
    setAllMoves([])
    setCurrentMoveIndex(-1)
  }

  // Notes context: index within the current opening's moves
  const openingMoveIndex: number | null =
    selected && currentMoveIndex >= 0 && currentMoveIndex < selected.moves.length
      ? currentMoveIndex
      : null
  const currentMoveFen = currentMoveIndex >= 0 ? allMoveFens[currentMoveIndex] : undefined

  return {
    openings: displayedOpenings,
    isLoading,
    selected,
    exactMatch,
    search,
    allMoves,
    currentMoveIndex,
    boardFen,
    currentMoveFen,
    openingMoveIndex,
    candidateMoves,
    shapes,
    lastMoveSquares,
    setSearch,
    setMoveIndex: handleMoveListClick,
    selectOpening: handleOpeningSelect,
    handleMove,
    resetBoard,
  }
}
