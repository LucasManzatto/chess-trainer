import { createFileRoute } from '@tanstack/react-router'
import { ChessBoardProvider, getSanMoves, getMoves, getActiveMove } from '../../../features/board'
import { ChessBoard } from '../../../features/board/components/ChessBoard/ChessBoard'
import { ChessBoardSettings } from '../../../features/board/components/ChessBoard/ChessBoardSettings'
import { EvaluationBar } from '../../../features/board/components/ChessBoard/ChessBoardEvalBar'
import { useChessBoardStore, useChessBoardStoreApi } from '../../../stores/board/chessBoardStore'
import { getCurrentFen, getCurrentLan, getParentFen } from '../../../stores/board/slices/gameSelectors'
import { usePositionEvaluation } from '../../../features/board/hooks/usePositionEvaluation'
import { useBoardSettings } from '../../../stores/board/boardSettingsStore'
import { useShallow } from 'zustand/shallow'
import { MovesList } from '../../../components/MovesList/MovesList'
import { OpeningsStoreProvider } from '../../../stores/openings/OpeningsStoreProvider'
import { Notes } from '../../../features/openings/components/Notes'
import { usePositionComments, usePosition, usePositionMoves } from '../../../data/hooks/useOpenings'
import { PositionName } from '../../../features/openings/components/PositionName'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import {
  useSyncOpeningToBoard,
  useBrowseDrillCard,
  useBrowseContinuations,
} from './hooks'

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/openings/browse')({
  component: BrowseV2Page,
})

// ─── Root (providers only) ────────────────────────────────────────────────────

function BrowseV2Page() {
  return (
    <ChessBoardProvider>
      <OpeningsStoreProvider>
        <BrowseV2PageInner />
      </OpeningsStoreProvider>
    </ChessBoardProvider>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowseV2PageInner() {
  useSyncOpeningToBoard()
  const store = useChessBoardStoreApi()
  const boardState = useChessBoardStore(
    useShallow((s) => ({
      fen: getCurrentFen(s),
      parentFen: getParentFen(s),
      sanMoves: getSanMoves(s),
      moves: getMoves(s),
      activeMove: getActiveMove(s),
      orientation: s.orientation,
      interactive: s.interactive,
      evalBestMove: s.evalBestMove,
      lastMove: getCurrentLan(s),
      drawn: s.drawnShapes,
      positionMove: s.currentMoveIndex < 0 ? undefined : {
        from_fen: getParentFen(s),
        to_fen: s.history[s.currentMoveIndex].fen,
        san: s.history[s.currentMoveIndex].san,
        lan: s.history[s.currentMoveIndex].lan,
      },
    })),
  )
  const config = useBoardSettings(
    useShallow((s) => ({
      showThreats: s.showThreats,
      showBestMove: s.showBestMove,
      boardSize: s.boardSize,
      moveStatDisplay: s.moveStatDisplay,
    })),
  )
  const { score, isLoading } = usePositionEvaluation(boardState.fen)

  const { position, upsert } = usePosition(boardState.fen)
  const { moves: continuations, create: createMove } = usePositionMoves(boardState.fen)
  const { comments, isLoading: notesLoading, add } = usePositionComments(boardState.fen)
  const { drillCard, existingCard } = useBrowseDrillCard(boardState.fen, boardState.parentFen, boardState.sanMoves)
  const { arrowShapes, saveArrowsAsMoves, isPending } = useBrowseContinuations({
    createMoveAsync: createMove.mutateAsync,
    isPending: createMove.isPending,
  })

  return (
    <div className="grid grid-cols-[1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">

      {/* Board + opening name + drill button */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <div className="flex flex-col items-stretch">
          <div className="relative flex items-center justify-center px-3 py-2">
            <PositionName
              name={position?.name ?? null}
              isSaving={upsert.isPending}
              onSave={(name) => {
                upsert.mutate({ name, moves: boardState.sanMoves })
                if (boardState.positionMove) createMove.mutate(boardState.positionMove)
              }}
            />
            <div className="absolute left-0 flex gap-1">
              {arrowShapes.length > 0 && (
                <button
                  onClick={saveArrowsAsMoves}
                  disabled={isPending}
                  title="Save drawn arrows as moves"
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  Save drawn moves ({arrowShapes.length})
                </button>
              )}
            </div>
            {drillCard && (
              <div className="absolute right-0">
                <AddToDrill
                  card={drillCard}
                  existingCard={existingCard}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-row gap-2">
              <div style={{ height: config.boardSize }}>
                <EvaluationBar score={score} isLoading={isLoading} />
              </div>
              <div className="relative">
                <ChessBoard
                  state={boardState}
                  shapes={{ continuations, drawn: boardState.drawn, brushes: {} }}
                  config={{ showBestMove: config.showBestMove, boardSize: config.boardSize }}
                  actions={{
                    applyMove: store.getState().applyMove,
                    navigateBack: store.getState().navigateBack,
                    navigateForward: store.getState().navigateForward,
                    setDrawnShapes: store.getState().setDrawnShapes,
                  }}
                />
                <ChessBoardSettings
                  config={config}
                  onConfigChange={updater => useBoardSettings.getState().setConfig(updater(config))}
                  onFlipOrientation={store.getState().flipOrientation}
                  onReset={store.getState().reset}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Move list */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <MovesList
          moves={boardState.moves}
          activeMove={boardState.activeMove}
          onMoveClick={(moveNumber, color) =>
            store.getState().navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
          }
        />
      </section>

      {/* Notes per position */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <Notes
          comments={comments}
          isLoading={notesLoading}
          onAdd={(content) => add.mutate(content)}
          addPending={add.isPending}
        />
      </section>

    </div>
  )
}
