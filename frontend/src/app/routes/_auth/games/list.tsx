import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ChessStoreProvider } from '../../../../components/ChessBoard/ChessStoreProvider'
import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { GamesList } from '../../../../features/games/components/GamesList/GamesList'
import { AnalysisPanel } from '../../../../features/games/components/GamesTab/AnalysisPanel'

const searchSchema = z.object({
  result: z.enum(['win', 'loss', 'draw']).nullable().default(null).catch(null),
  color: z.enum(['white', 'black']).nullable().default(null).catch(null),
  time_class: z.enum(['bullet', 'blitz', 'rapid', 'daily']).nullable().default(null).catch(null),
  eco: z.string().default('').catch(''),
  gameId: z.number().optional().catch(undefined),
})

export const Route = createFileRoute('/_auth/games/list')({
  validateSearch: searchSchema,
  component: GamesListPage,
})

function GamesListPage() {
  return <ChessStoreProvider><GamesListPageInner /></ChessStoreProvider>
}

function GamesListPageInner() {
  return (
    <div className="grid grid-cols-[300px_1fr_220px_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        <GamesList />
      </section>

      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          showThreatsControl
          defaultShowThreats
        />
      </section>

      <MoveList />

      <AnalysisPanel />
    </div>
  )
}
