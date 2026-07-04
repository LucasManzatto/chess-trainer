import { useEffect } from 'react'
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
import { Notes } from '../../../features/openings/components/Notes'
import { usePositionComments, usePosition, usePositionAnnotations } from '../../../data/hooks/usePositions'
import { PositionName } from '../../../features/openings/components/PositionName'
import { SaveAnnotationsButton } from '../../../features/openings/components/SaveAnnotationsButton'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { useBrowseDrillCard } from './hooks'

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/openings/browse')({
  component: BrowsePage,
})

const PANEL_CLASS = 'flex flex-col min-h-0 overflow-hidden'
const DIVIDER_CLASS = 'border-l border-white/[0.07]'

// ─── Root (providers only) ────────────────────────────────────────────────────

function BrowsePage() {
  return (
    <ChessBoardProvider>
      <BrowsePageInner />
    </ChessBoardProvider>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowsePageInner() {
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
  const setConfig = useBoardSettings((s) => s.setConfig)
  const annotations = useChessBoardStore(
    useShallow((s) => ({
      draftArrows: s.draftArrows,
      draftCircles: s.draftCircles,
      annotationsDirty: s.annotationsDirty,
      syncAnnotations: s.syncAnnotations,
      setDraftAnnotations: s.setDraftAnnotations,
      markAnnotationsSaved: s.markAnnotationsSaved,
    })),
  )
  const { score, isLoading } = usePositionEvaluation(boardState.fen)

  const { data: positionDetail, isLoading: notesLoading, upsert } = usePosition(boardState.fen)
  const { comments, arrows, circles } = positionDetail
  const { add, remove: removeComment } = usePositionComments(boardState.fen)
  const { drillCard, existingCard } = useBrowseDrillCard(boardState.fen, boardState.parentFen, boardState.sanMoves)
  const { replace: replaceAnnotations } = usePositionAnnotations(boardState.fen)

  useEffect(() => {
    annotations.syncAnnotations(arrows, circles)
  }, [arrows, circles, annotations.syncAnnotations])

  return (
    <div className="grid grid-cols-[220px_minmax(0,auto)_1fr] gap-5 p-6 h-full w-full overflow-hidden">

      {/* Move list */}
      <section className={PANEL_CLASS}>
        <MovesList
          moves={boardState.moves}
          activeMove={boardState.activeMove}
          onMoveClick={(moveNumber, color) =>
            boardState.navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
          }
        />
      </section>

      {/* Board + opening name + drill button */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS} pl-5 items-center justify-center`}>
        <div className="flex flex-col items-stretch min-w-0">
          <div className="flex items-end justify-between gap-3 px-1 pb-3 min-w-0">
            {notesLoading ? (
              <span className="text-2xl font-semibold tracking-tight text-white/20 italic select-none">
                Loading...
              </span>
            ) : (
              <PositionName
                name={positionDetail.position?.name ?? null}
                isSaving={upsert.isPending}
                onSave={(name) => upsert.mutate({ name, moves: boardState.sanMoves })}
                className="text-2xl font-semibold tracking-tight text-white/90 cursor-text select-none truncate min-w-0"
              />
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {annotations.annotationsDirty && (
                <SaveAnnotationsButton
                  text={replaceAnnotations.isPending ? 'Saving...' : 'Save annotations'}
                  disabled={replaceAnnotations.isPending}
                  onSave={() =>
                    replaceAnnotations.mutate(
                      { arrows: annotations.draftArrows, circles: annotations.draftCircles },
                      { onSuccess: annotations.markAnnotationsSaved },
                    )
                  }
                />
              )}
              {drillCard && (
                <AddToDrill
                  card={drillCard}
                  existingCard={existingCard}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded px-3 py-1.5 transition-colors cursor-pointer"
                />
              )}
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <div
              className="flex items-center rounded p-1"
              style={{ height: config.boardSize }}
            >
              <EvaluationBar score={score} isLoading={isLoading} />
            </div>
            <div className="relative">
              <ChessBoard
                state={boardState}
                arrows={annotations.draftArrows}
                circles={annotations.draftCircles}
                config={{ showBestMove: config.showBestMove, boardSize: config.boardSize }}
                actions={{
                  applyMove: boardState.applyMove,
                  navigateBack: boardState.navigateBack,
                  navigateForward: boardState.navigateForward,
                  onDrawableChange: annotations.setDraftAnnotations,
                }}
              />
              <ChessBoardSettings
                config={config}
                onConfigChange={updater => setConfig(updater(config))}
                onFlipOrientation={boardState.flipOrientation}
                onReset={boardState.reset}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Notes per position — fills remaining right-side space */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS} pl-5 w-full`}>
        {notesLoading ? (
          <p className="text-sm text-white/25 p-4">Loading…</p>
        ) : (
          <Notes
            fen={boardState.fen}
            comments={comments}
            onAdd={(content) => add.mutate(content)}
            addPending={add.isPending}
            onRemove={(id) => removeComment.mutate(id)}
            arrows={annotations.draftArrows}
            circles={annotations.draftCircles}
            onArrowColorChange={(index, color) =>
              annotations.setDraftAnnotations(
                annotations.draftArrows.map((a, i) => (i === index ? { ...a, color } : a)),
                annotations.draftCircles,
              )
            }
            onCircleColorChange={(index, color) =>
              annotations.setDraftAnnotations(
                annotations.draftArrows,
                annotations.draftCircles.map((c, i) => (i === index ? { ...c, color } : c)),
              )
            }
            onArrowCommentChange={(index, comment) =>
              annotations.setDraftAnnotations(
                annotations.draftArrows.map((a, i) => (i === index ? { ...a, comment } : a)),
                annotations.draftCircles,
              )
            }
            onCircleCommentChange={(index, comment) =>
              annotations.setDraftAnnotations(
                annotations.draftArrows,
                annotations.draftCircles.map((c, i) => (i === index ? { ...c, comment } : c)),
              )
            }
          />
        )}
      </section>

    </div>
  )
}
