import { useMemo } from 'react'
import { INITIAL_FEN, useChessBoardStore } from '../../../../features/board'
import { getSanMoves } from '../../../../lib/chess'
import { useRepertoireCards } from '../../../../features/train/hooks/useRepertoireCards'
import type { CardCreate, RepertoireCard } from '../../../../features/train/types'
import type { HistoryEntry } from '../../../../lib/chess/types'

function getSideFromFen(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

function getDrillCard(
  history: HistoryEntry[],
  currentMoveIndex: number,
  sanMoves: string[],
  preAnswerFen: string,
): CardCreate | null {
  if (currentMoveIndex < 0) return null
  return { fen: history[currentMoveIndex].fen, moves: sanMoves, side: getSideFromFen(preAnswerFen) }
}

function getExistingCard(
  drillCard: CardCreate | null,
  allCards: RepertoireCard[],
  preAnswerFen: string,
): RepertoireCard | null {
  return drillCard ? allCards.find(c => c.fen === preAnswerFen) ?? null : null
}

export function useBrowseDrillCard() {
  const history          = useChessBoardStore(s => s.history)
  const currentMoveIndex = useChessBoardStore(s => s.currentMoveIndex)
  const { data: allCards = [] } = useRepertoireCards()

  const preAnswerFen = currentMoveIndex > 0 ? history[currentMoveIndex - 1].fen : INITIAL_FEN

  const sanMoves  = useMemo(() => getSanMoves(history, currentMoveIndex), [history, currentMoveIndex])
  const drillCard = useMemo(
    () => getDrillCard(history, currentMoveIndex, sanMoves, preAnswerFen),
    [history, currentMoveIndex, sanMoves, preAnswerFen],
  )
  const existingCard = useMemo(
    () => getExistingCard(drillCard, allCards, preAnswerFen),
    [drillCard, allCards, preAnswerFen],
  )

  return { drillCard, existingCard }
}
