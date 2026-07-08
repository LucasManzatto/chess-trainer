import { getSideFromFen } from '../../../../lib/chess'
import { useRepertoireCards } from '../../../../data/hooks/useTrain'


export function useBrowseDrillCard(fen: string, preAnswerFen: string, sanMoves: string[], lastMove: string | undefined) {
  const { data: cards = [] } = useRepertoireCards()
  // Multiple cards can share the same question fen (different candidate moves drilled
  // from the same position) — must match the move actually played, not just the position.
  const existing = cards.find(c => c.fen === preAnswerFen && c.answer === lastMove)
  const drillCard = {
    fen: fen,
    moves: sanMoves,
    side: getSideFromFen(preAnswerFen),
    ...(existing ? { position_id: existing.position_id } : {}),
  }
  return { drillCard }
}
