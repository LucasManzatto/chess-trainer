import { useEffect, useState } from 'react'
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
import { GradeButtons } from '../../../features/train/components/MoveReveal'
import { useCommitMove, useCoverage, useDeleteCard, useDueCards } from '../../../data/hooks/useTrain'
import { useDrillBoard } from '../../../features/train/hooks/useDrillBoard'
import { useBrowseDrillCard } from './hooks'
import { GamesListSheet } from '../../../features/games/components/GamesList/GamesListSheet'
import { AnalysisSheet } from '../../../features/games/components/GamesTab/AnalysisSheet'
import { PanelToggleButtons } from '../../../features/games/components/PanelToggleButtons'
import { TrainSheet } from '../../../features/train/components/TrainSheet'
import type { TrainMode } from '../../../features/train/types'
import { useAnalyzeAllGames, useGameAnalyze, useGames, useGamesSync } from '../../../data/hooks/useGames'
import type { GamesFilters } from '../../../features/games/types'

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
  // ─── Store data ────────────────────────────────────────────────────────────
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
      history: s.history,
      applyMove: s.applyMove,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
      navigateToIndex: s.navigateToIndex,
      flipOrientation: s.flipOrientation,
      reset: s.reset,
      loadMoves: s.loadMoves,
      setOrientation: s.setOrientation,
      setInteractive: s.setInteractive,
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

  // ─── Local state ───────────────────────────────────────────────────────────
  // (declared before API data — some queries below are parameterized by these)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [trainMode, setTrainMode] = useState<TrainMode | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [gamesFilters, setGamesFilters] = useState<GamesFilters>({ result: null, color: null, has_critical_moves: null })

  // ─── API data: position (eval, notes, comments, annotations) ────────────────
  const { score: evalScore, isLoading: evalLoading } = usePositionEvaluation(boardState.fen)
  const { data: positionDetail, isLoading: positionLoading, upsert } = usePosition(boardState.fen)
  const { comments, arrows, circles } = positionDetail
  const { add, update: updateComment } = usePositionComments(boardState.fen)
  const { replace: replaceAnnotations } = usePositionAnnotations(boardState.fen)

  // ─── API data: drill / train ─────────────────────────────────────────────
  const { drillCard } = useBrowseDrillCard(boardState.fen, boardState.parentFen, boardState.sanMoves)
  const { mutate: commitMove, isPending: commitPending } = useCommitMove()
  const { mutate: deleteCard, isPending: deletePending } = useDeleteCard()
  const { data: dueCards = [] } = useDueCards()
  const { data: coverage } = useCoverage()
  const { phase: trainPhase, setPhase: setTrainPhase, currentCard: trainCard } = useDrillBoard(
    dueCards,
    boardState.history,
    boardState.loadMoves,
    boardState.setOrientation,
    boardState.setInteractive,
    boardState.reset,
  )

  // ─── API data: games ─────────────────────────────────────────────────────
  const { data: gamesData, isLoading: gamesLoading } = useGames(gamesFilters.result, gamesFilters.color, gamesFilters.has_critical_moves)
  const { syncStatus, isRunning: syncRunning, triggerSync } = useGamesSync()
  const { analyzeAll, isRunning: analyzeAllRunning, progress: analyzeAllProgress, pendingCount } = useAnalyzeAllGames(gamesData?.items)

  // ─── Derived state ─────────────────────────────────────────────────────────
  const trainRevealed = trainMode !== null && trainPhase.type === 'revealed'
  const trainHideOverlay = trainMode !== null && !trainRevealed
  const selectedGame = gamesData?.items.find(g => g.id === selectedGameId) ?? null
  const criticalMoveIndices = selectedGame?.critical_moves ?? []

  const onSelectGame = (id: number) => {
    setSelectedGameId(id)
    setGamesOpen(false)
  }

  // useGameAnalyze depends on the derived `selectedGame` above.
  const { analyze, analyzeStatus, analyzeProgress } = useGameAnalyze(selectedGame?.id ?? null)

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    annotations.syncAnnotations(arrows, circles)
  }, [arrows, circles, annotations.syncAnnotations])

  useEffect(() => {
    if (!selectedGame) return
    boardState.loadMoves(selectedGame.moves)
    boardState.setOrientation(selectedGame.user_color)
    // boardState.setInteractive(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame?.id])

  return (
    <>
    <div className="flex h-full w-full overflow-hidden">
  <PanelToggleButtons
      gamesOpen={gamesOpen}
      onToggleGames={() => setGamesOpen(o => !o)}
      analysisOpen={analysisOpen}
      onToggleAnalysis={() => setAnalysisOpen(o => !o)}
      analysisDisabled={!selectedGame}
      drillOpen={trainMode === 'drill'}
      onToggleDrill={() => setTrainMode(m => (m === 'drill' ? null : 'drill'))}
      sparOpen={trainMode === 'spar'}
      onToggleSpar={() => setTrainMode(m => (m === 'spar' ? null : 'spar'))}
    />
    <div className="grid grid-cols-[194px_minmax(0,auto)_1fr] min-w-0 flex-1 overflow-hidden">

      {/* Move list */}
      <section className={`${PANEL_CLASS} h-full w-full`}>
        <MovesList
          moves={boardState.moves}
          activeMove={boardState.activeMove}
          criticalMoveIndices={criticalMoveIndices}
          onMoveClick={(moveNumber, color) =>
            boardState.navigateToIndex((moveNumber - 1) * 2 + (color === 'black' ? 1 : 0))
          }
        />
      </section>

      {/* Board + opening name + drill button */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS}`}>
        <div className="flex h-11 w-full items-center justify-between gap-3 px-4 border-white/[0.08] flex-shrink-0">
          {positionLoading ? (
            <span className="text-sm font-semibold tracking-tight text-white/20 italic select-none">
              Loading...
            </span>
          ) : (
            <PositionName
              name={positionDetail.position?.name ?? null}
              isSaving={upsert.isPending}
              onSave={(name) => upsert.mutate({ name, moves: boardState.sanMoves })}
              className="text-sm font-semibold tracking-tight text-white/90 cursor-text select-none truncate min-w-0"
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
            <AddToDrill
              card={drillCard}
              commitMove={commitMove}
              isAdding={commitPending}
              deleteCard={deleteCard}
              isRemoving={deletePending}
            />
          </div>
        </div>
        <div className="flex flex-1 min-h-0 items-center justify-center pl-5 pr-12">
          <div className="flex flex-row gap-2">
            <div
              className="flex items-center rounded p-1"
              style={{ height: config.boardSize }}
            >
              <EvaluationBar score={evalScore} isLoading={evalLoading} />
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <ChessBoard
                  state={boardState}
                  arrows={trainHideOverlay ? [] : annotations.draftArrows}
                  circles={trainHideOverlay ? [] : annotations.draftCircles}
                  config={{ showBestMove: trainHideOverlay ? false : config.showBestMove, boardSize: config.boardSize }}
                  actions={{
                    applyMove: boardState.applyMove,
                    navigateBack: boardState.navigateBack,
                    navigateForward: boardState.navigateForward,
                    onDrawableChange: annotations.setDraftAnnotations,
                  }}
                />
                <ChessBoardSettings
                  config={config}
                  fen={boardState.fen}
                  onConfigChange={updater => setConfig(updater(config))}
                  onFlipOrientation={boardState.flipOrientation}
                  onReset={boardState.reset}
                />
              </div>
              <div className={`w-full px-5 pt-3 pb-3${trainRevealed ? '' : ' invisible'}`}>
                <GradeButtons card={trainCard} onGrade={() => setTrainPhase({ type: 'done' })} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notes per position — fills remaining right-side space */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS} w-full`}>
        {trainMode !== null && trainPhase.type === 'awaiting_move' ? null : positionLoading ? (
          <p className="text-sm text-white/25 p-4">Loading…</p>
        ) : (
          <Notes
            fen={boardState.fen}
            comments={comments}
            onAdd={(content) => add.mutate(content)}
            onUpdate={(id, content) => updateComment.mutate({ commentId: id, content })}
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
    </div>

    <GamesListSheet
      open={gamesOpen}
      onOpenChange={setGamesOpen}
      games={gamesData?.items ?? []}
      total={gamesData?.total ?? 0}
      isLoading={gamesLoading}
      isSelected={id => id === selectedGameId}
      filters={gamesFilters}
      onFiltersChange={patch => setGamesFilters(prev => ({ ...prev, ...patch }))}
      analyzeStatus={analyzeStatus}
      analyzeProgress={analyzeProgress}
      onSelect={onSelectGame}
      onAnalyze={analyze}
      syncControls={{
        isRunning: syncRunning,
        syncStatus,
        onSync: triggerSync,
        isAnalyzingAll: analyzeAllRunning,
        analyzeAllProgress,
      pendingAnalyzeCount: pendingCount,
        onAnalyzeAll: analyzeAll,
      }}
    />
    <AnalysisSheet
      open={analysisOpen}
      onOpenChange={setAnalysisOpen}
      game={selectedGame}
      criticalMoveIndices={criticalMoveIndices}
    />
    <TrainSheet
      open={trainMode === 'drill' && trainPhase.type === 'idle'}
      onClose={() => setTrainMode(null)}
      mode="drill"
      onModeChange={setTrainMode}
      onStart={() => setTrainPhase({ type: 'loading' })}
      coverage={coverage}
      dueCards={dueCards}
    />
    <TrainSheet
      open={trainMode === 'spar' && trainPhase.type === 'idle'}
      onClose={() => setTrainMode(null)}
      mode="spar"
      onModeChange={setTrainMode}
      onStart={() => setTrainPhase({ type: 'loading' })}
      coverage={coverage}
      dueCards={dueCards}
    />
    </>
  )
}
