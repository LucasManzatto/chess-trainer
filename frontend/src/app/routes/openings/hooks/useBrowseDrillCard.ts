import { getSideFromFen } from '../../../../lib/chess'
import { useRepertoireCards } from '../../../../data/hooks/useTrain'


export function useBrowseDrillCard(fen: string, preAnswerFen: string, sanMoves: string[]) {
  const { data: allCards = [] } = useRepertoireCards()
  const drillCard = { fen: fen, moves: sanMoves, side: getSideFromFen(preAnswerFen) }
  const existingCard = drillCard ? allCards.find(c => c.fen === preAnswerFen) ?? null : null
  return { drillCard, existingCard }
}
