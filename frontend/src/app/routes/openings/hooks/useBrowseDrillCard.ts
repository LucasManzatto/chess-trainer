import { getSideFromFen } from '../../../../lib/chess'
import { useRepertoireCards } from '../../../../data/hooks/useTrain'


export function useBrowseDrillCard(fen: string, preAnswerFen: string, sanMoves: string[]) {
  const { data: cards = [] } = useRepertoireCards()
  const existing = cards.find(c => c.fen === preAnswerFen)
  const drillCard = {
    fen: fen,
    moves: sanMoves,
    side: getSideFromFen(preAnswerFen),
    ...(existing ? { position_id: existing.position_id } : {}),
  }
  return { drillCard }
}
