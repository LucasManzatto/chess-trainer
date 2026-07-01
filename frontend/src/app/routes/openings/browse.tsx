import { createFileRoute } from '@tanstack/react-router'
import { ChessBoardProvider, getSanMoves, getMoves, getActiveMove } from '../../../features/board'
import { ChessBoard } from '../../../features/board/components/ChessBoard/ChessBoard'
import { ChessBoardSettings } from '../../../features/board/components/ChessBoard/ChessBoardSettings'
import { EvaluationBar } from '../../../features/board/components/ChessBoard/ChessBoardEvalBar'
import { useChessBoardStore } from '../../../stores/board/chessBoardStore'
import { getCurrentFen, getCurrentLan, getParentFen } from '../../../stores/board/slices/gameSelectors'
import { usePositionEvaluation } from '../../../features/board/hooks/usePositionEvaluation'
import { useBoardSettings } from '../../../stores/board/boardSettingsStore'
import { useShallow } from 'zustand/shallow'
import { MovesList } from '../../../components/MovesList/MovesList'
import { OpeningsStoreProvider } from '../../../stores/openings/OpeningsStoreProvider'
import { Notes } from '../../../features/openings/components/Notes'
import { usePositionComments, usePosition, usePositionAnnotations } from '../../../data/hooks/usePositions'
import { PositionName } from '../../../features/openings/components/PositionName'
import { PositionActions } from '../../../features/openings/components/PositionActions'
import { useBrowseDrillCard, useAnnotationDraft } from './hooks'

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
  const boardState = useChessBoardStore(
    useShallow((s) => ({
      fen: getCurrentFen(s),
      parentFen: getParentFen(s),
      sanMoves: getSanMoves(s),
      moves: getMoves(s),
      activeMove: getActiveMove(s),
      orientation: s.orientation,
      interactive: s.interactive,
      lastMove: getCurrentLan(s),
      applyMove: s.applyMove,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
      navigateToIndex: s.navigateToIndex,
      flipOrientation: s.flipOrientation,
      reset: s.reset,
    })),
  )
  const config = useBoardSettings(
    useShallow((s) => ({
      showThreats: s.showThreats,
      showBestMove: s.showBestMove,
      boardSize: s.boardSize,
    })),
  )
  const { score, isLoading } = usePositionEvaluation(boardState.fen)

  const { data: positionDetail, isLoading: notesLoading, upsert } = usePosition(boardState.fen)
  const { comments, arrows, circles } = positionDetail
  const { add } = usePositionComments(boardState.fen)
  const { drillCard, existingCard } = useBrowseDrillCard(boardState.fen, boardState.parentFen, boardState.sanMoves)
  const { replace: replaceAnnotations } = usePositionAnnotations(boardState.fen)
  const annotationDraft = useAnnotationDraft(boardState.fen, arrows, circles, notesLoading, replaceAnnotations)

  return (
    <div className="grid grid-cols-[1fr_220px_280px] gap-5 p-6 h-full w-full overflow-hidden">

      {/* Board + opening name + drill button */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded">
        <div className="flex flex-col items-stretch">
          <div className="flex items-end justify-between gap-3 px-1 pb-3">
            <PositionName
              name={positionDetail.position?.name ?? null}
              isSaving={upsert.isPending}
              onSave={(name) => upsert.mutate({ name, moves: boardState.sanMoves })}
              className="text-2xl font-semibold tracking-tight text-white/90 cursor-text select-none"
            />
            <PositionActions
              drillCard={drillCard}
              existingCard={existingCard}
              annotationsDirty={annotationDraft.isDirty}
              onSaveAnnotations={annotationDraft.commit}
              savingAnnotations={annotationDraft.isSaving}
            />
          </div>
          <div className="flex flex-row gap-2">
            <div
              className="flex items-center rounded border border-white/10 bg-black/20 p-1"
              style={{ height: config.boardSize }}
            >
              <EvaluationBar score={score} isLoading={isLoading} />
            </div>
            <div className="relative">
              <ChessBoard
                state={boardState}
                arrows={annotationDraft.arrows}
                circles={annotationDraft.circles}
                config={{ showBestMove: config.showBestMove, boardSize: config.boardSize }}
                actions={{
                  applyMove: boardState.applyMove,
                  navigateBack: boardState.navigateBack,
                  navigateForward: boardState.navigateForward,
                  onAnnotationsChange: annotationDraft.onAnnotationsChange,
                }}
              />
              <ChessBoardSettings
                config={config}
                onConfigChange={updater => useBoardSettings.getState().setConfig(updater(config))}
                onFlipOrientation={boardState.flipOrientation}
                onReset={boardState.reset}
                annotationsDirty={annotationDraft.isDirty}
                onResetAnnotations={annotationDraft.reset}
              />
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
            boardState.navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
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
