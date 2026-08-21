import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChessBoardProvider, getSanMoves, getMoves, getActiveMove } from '../../../features/board'
import { ChessBoard } from '../../../features/board/components/ChessBoard/ChessBoard'
import { ChessBoardSettings } from '../../../features/board/components/ChessBoard/ChessBoardSettings'
import { EvaluationBar } from '../../../features/board/components/ChessBoard/ChessBoardEvalBar'
import { useChessBoardStore } from '../../../stores/board/chessBoardStore'
import { getAncestorFens, getCurrentFen, getCurrentLan, getParentFen, getUciMoves } from '../../../stores/board/slices/gameSelectors'
import { usePositionEvaluation } from '../../../features/board/hooks/usePositionEvaluation'
import { useBoardSettings } from '../../../stores/board/boardSettingsStore'
import { useShallow } from 'zustand/shallow'
import { Button } from '@/components/ui/button'
import { MovesList } from '../../../components/MovesList/MovesList'
import { Notes } from '../../../features/openings/components/Notes'
import { useNearestOpening, useOpeningBranches, usePositionComments, usePosition, usePositionAnnotations } from '../../../data/hooks/usePositions'
import { PositionName } from '../../../features/openings/components/PositionName'
import { SaveAnnotationsButton } from '../../../features/openings/components/SaveAnnotationsButton'
import { AddToDrill } from '../../../features/train/components/AddToDrill'
import { GradeButtons } from '../../../features/train/components/MoveReveal'
import { useCommitMove, useCoverage, useDeleteCard } from '../../../data/hooks/useTrain'
import { useBrowseDrillCard } from './hooks'
import { GamesListSheet } from '../../../features/games/components/GamesList/GamesListSheet'
import { AnalysisSheet } from '../../../features/games/components/GamesTab/AnalysisSheet'
import { PanelToggleButtons } from '../../../features/games/components/PanelToggleButtons'
import { TrainSheet } from '../../../features/train/components/TrainSheet'
import { useDrill, type PageMode } from '../../../features/train/hooks/useDrill'
import type { TrainMode } from '../../../features/train/types'
import { useAnalyzeAllGames, useGameAnalyze, useGames, useGamesSync, useSetGameReviewed } from '../../../data/hooks/useGames'
import type { GamesFilters, Game } from '../../../features/games/types'
import type { BoardAnnotationArrow } from '../../../features/board/types'
import type { ActiveMove } from '../../../lib/chess/types'

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/openings/browse')({
  component: BrowsePage,
})

const PANEL_CLASS = 'flex flex-col min-h-0 overflow-hidden'
const DIVIDER_CLASS = 'border-l border-white/[0.07]'

function moveIndexFromMove(moveNumber: number, color: 'white' | 'black'): number {
  return (moveNumber - 1) * 2 + (color === 'black' ? 1 : 0)
}

function getBestMoveArrow(
  activeMove: ActiveMove | undefined,
  selectedGame: Game | null,
  showBestMove: boolean,
  draftArrows: BoardAnnotationArrow[],
): BoardAnnotationArrow[] {
  if (!showBestMove) return []
  const activeMoveIndex = activeMove ? moveIndexFromMove(activeMove.moveNumber, activeMove.color) : -1
  const bestMove = selectedGame?.analysis?.moves[activeMoveIndex + 1]?.best_move
  if (!bestMove) return []
  const bestMoveFromTo = { from_square: bestMove.slice(0, 2), to_square: bestMove.slice(2, 4) }
  const hasMatchingDraftArrow = draftArrows.some(
    a => a.from_square === bestMoveFromTo.from_square && a.to_square === bestMoveFromTo.to_square,
  )
  return hasMatchingDraftArrow
    ? []
    : [{ ...bestMoveFromTo, color: 'B', category: 'best_move', comment: null, line_style: 'solid', order: null, line_id: null }]
}

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
      ancestorFens: getAncestorFens(s),
      sanMoves: getSanMoves(s),
      uciMoves: getUciMoves(s),
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
      updateArrow: s.updateArrow,
      updateCircle: s.updateCircle,
      deleteArrow: s.deleteArrow,
      deleteCircle: s.deleteCircle,
      linkArrows: s.linkArrows,
      unlinkArrow: s.unlinkArrow,
      updateLine: s.updateLine,
      reorderLineMembers: s.reorderLineMembers,
      deleteLine: s.deleteLine,
      reorderArrowEntries: s.reorderArrowEntries,
      reorderCircles: s.reorderCircles,
    })),
  )

  // ─── Local state ───────────────────────────────────────────────────────────
  // (declared before API data — some queries below are parameterized by these)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [drillDialogOpen, setDrillDialogOpen] = useState(false)
  const [pageMode, setPageMode] = useState<PageMode>({ type: 'default' })
  const [gamesFilters, setGamesFilters] = useState<GamesFilters>({ result: null, color: null, has_critical_moves: null, reviewed: null, first_critical_move: null, left_repertoire: null })
  // Key of the annotation currently hovered — set from either AnnotationsList (row hover) or
  // ChessBoard (shape hover) — so both sides highlight the same annotation and dim the rest.
  const [hoveredAnnotationKey, setHoveredAnnotationKey] = useState<string | null>(null)

  // ─── API data: position (eval, notes, comments, annotations) ────────────────
  const { score: evalScore, isLoading: evalLoading } = usePositionEvaluation(boardState.fen)
  const { data: positionDetail, isLoading: positionLoading } = usePosition(boardState.fen)
  const { comments, arrows, circles } = positionDetail
  // Annotations for the last played move live on the position it was played from, not the resulting one.
  const { data: parentPositionDetail } = usePosition(boardState.parentFen)
  const { add, update: updateComment } = usePositionComments(boardState.fen)
  const { replace: replaceAnnotations } = usePositionAnnotations(boardState.fen)
  const { data: openingLookup } = useNearestOpening(boardState.ancestorFens)
  const openingName = openingLookup?.opening.name ?? null
  const openingIsExact = openingLookup?.is_exact ?? false
  const { data: openingBranches } = useOpeningBranches(boardState.uciMoves)

  // ─── API data: drill / train ─────────────────────────────────────────────
  const { drillCard } = useBrowseDrillCard(boardState.fen, boardState.parentFen, boardState.sanMoves, boardState.lastMove)
  const { mutate: commitMove, isPending: commitPending } = useCommitMove()
  const { mutate: deleteCard, isPending: deletePending } = useDeleteCard()
  const { data: coverage } = useCoverage()

  // ─── API data: games ─────────────────────────────────────────────────────
  const { data: gamesData, status: gamesStatus } = useGames(gamesFilters.result, gamesFilters.color, gamesFilters.has_critical_moves, gamesFilters.reviewed, gamesFilters.first_critical_move, gamesFilters.left_repertoire)
  const { syncStatus, status: syncStatusPhase, triggerSync } = useGamesSync()
  const { analyzeAll, status: analyzeAllStatus, progress: analyzeAllProgress, pendingCount } = useAnalyzeAllGames(gamesData?.items)
  const { mutate: setGameReviewed } = useSetGameReviewed()

  const setPageModeDefault = () => {
    setPageMode({ type: 'default' })
    boardState.reset()
  }

  const {
    dueCards,
    trainPhase,
    trainCard,
    trainRevealed,
    trainHideOverlay,
    startTrainSession: startDrillSession,
    setPageModeDrill,
  } = useDrill(boardState, pageMode, setPageMode, setPageModeDefault)

  // ─── Derived state ─────────────────────────────────────────────────────────
  const selectedGameId = pageMode.type === 'game_review' ? pageMode.gameId : null
  const selectedGame = pageMode.type === 'game_review' ? gamesData?.items.find(g => g.id === selectedGameId) ?? null : null
  const criticalMoveIndices = selectedGame?.critical_moves ?? []
  const bestMoveArrow = getBestMoveArrow(boardState.activeMove, selectedGame, config.showBestMove, annotations.draftArrows)
  const lastMove = boardState.lastMove
    ? (() => {
        const from = boardState.lastMove.slice(0, 2)
        const to = boardState.lastMove.slice(2, 4)
        const comment =
          parentPositionDetail.arrows.find(a => a.from_square === from && a.to_square === to)?.comment
          ?? parentPositionDetail.circles.find(c => c.square === to)?.comment
          ?? null
        return { label: boardState.sanMoves.at(-1) ?? boardState.lastMove, comment }
      })()
    : null
  const { analyze, analyzeStatus, analyzeProgress } = useGameAnalyze(selectedGame?.id ?? null)

  const startTrainSession = (mode: TrainMode) => {
    startDrillSession(mode)
    setDrillDialogOpen(false)
  }

  const resetGame = () => {
    if (!selectedGame) return
    boardState.reset()
    boardState.loadMoves(selectedGame.moves)
    boardState.setOrientation(selectedGame.user_color)
  }

  const setPageModeGameReview = (game: Game) => {
    setPageMode({ type: 'game_review', gameId: game.id })
    setGamesOpen(false)
    boardState.reset()
    boardState.loadMoves(game.moves)
    boardState.setOrientation(game.user_color)
  }

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    annotations.syncAnnotations(arrows, circles)
  }, [arrows, circles, annotations.syncAnnotations])

  return (
    <>
    <div className="flex h-full w-full overflow-hidden">
  <PanelToggleButtons
      gamesOpen={gamesOpen}
      onToggleGames={() => setGamesOpen(o => !o)}
      analysisOpen={analysisOpen}
      onToggleAnalysis={() => setAnalysisOpen(o => !o)}
      analysisDisabled={!selectedGame}
      drillOpen={drillDialogOpen}
      onToggleDrill={() => setDrillDialogOpen(true)}
    />
    <div className="grid grid-cols-[194px_minmax(0,auto)_1fr] min-w-0 flex-1 overflow-hidden">

      {/* Move list */}
      <section className={`${PANEL_CLASS} h-full w-full`}>
        <MovesList
          moves={boardState.moves}
          activeMove={boardState.activeMove}
          criticalMoveIndices={criticalMoveIndices}
          onMoveClick={(moveNumber, color) =>
            boardState.navigateToIndex(moveIndexFromMove(moveNumber, color))
          }
        />
      </section>

      {/* Board + opening name + drill button */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS}`}>
        <div className="flex h-11 w-full items-center justify-between gap-3 px-4 border-white/[0.08] flex-shrink-0">
          <PositionName
            openingName={openingName}
            isExact={openingIsExact}
            branches={openingBranches}
            className="text-sm font-semibold tracking-tight text-white/90 select-none truncate min-w-0"
          />
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
              className="flex items-center rounded p-1 w-5"
              style={{ height: config.boardSize }}
            >
              {pageMode.type === 'drill' && trainPhase.type === 'awaiting_move' ? null : (
                <EvaluationBar score={evalScore} isLoading={evalLoading} />
              )}
            </div>
            <div className="flex flex-col items-center">
              {selectedGame && (
                <div className="flex w-full items-center justify-between gap-3 pb-2 text-xs text-white/60">
                  <span className="truncate">
                    {selectedGame.white_username} vs {selectedGame.black_username}
                  </span>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={resetGame} className="text-white/50 hover:text-white/80">
                      Reset
                    </Button>
                    <Button variant="ghost" size="sm" onClick={setPageModeDefault} className="text-white/50 hover:text-white/80">
                      Exit game
                    </Button>
                  </div>
                </div>
              )}
              <div className="relative">
                <ChessBoard
                  state={boardState}
                  arrows={trainHideOverlay ? [] : [...annotations.draftArrows, ...bestMoveArrow]}
                  circles={trainHideOverlay ? [] : annotations.draftCircles}
                  config={{ showBestMove: trainHideOverlay ? false : config.showBestMove, boardSize: config.boardSize }}
                  hoveredKey={hoveredAnnotationKey}
                  actions={{
                    applyMove: boardState.applyMove,
                    navigateBack: boardState.navigateBack,
                    navigateForward: boardState.navigateForward,
                    onDrawableChange: annotations.setDraftAnnotations,
                    onHoverEntry: setHoveredAnnotationKey,
                  }}
                />
                <ChessBoardSettings
                  config={config}
                  fen={boardState.fen}
                  onConfigChange={updater => setConfig(updater(config))}
                  onFlipOrientation={boardState.flipOrientation}
                  onReset={setPageModeDefault}
                />
              </div>
              <div className={`w-full px-5 pt-3 pb-3${trainRevealed ? '' : ' invisible'}`}>
                <GradeButtons card={trainCard} onGrade={() => setPageModeDrill({ type: 'loading' })} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={setPageModeDefault}
                className={`mt-2 text-white/40 hover:text-white/70${pageMode.type === 'drill' ? '' : ' invisible'}`}
              >
                Exit session
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Notes per position — fills remaining right-side space */}
      <section className={`${PANEL_CLASS} ${DIVIDER_CLASS} w-full`}>
        {pageMode.type === 'drill' && trainPhase.type === 'awaiting_move' ? null : positionLoading ? (
          <p className="text-sm text-white/25 p-4">Loading…</p>
        ) : (
          <Notes
            fen={boardState.fen}
            comments={comments}
            onAdd={(content) => add.mutate(content)}
            onUpdate={(id, content) => updateComment.mutate({ commentId: id, content })}
            arrows={annotations.draftArrows}
            circles={annotations.draftCircles}
            lastMove={lastMove}
            lastNotes={parentPositionDetail.comments}
            annotationActions={annotations}
            hoveredAnnotationKey={hoveredAnnotationKey}
            onHoverAnnotation={setHoveredAnnotationKey}
          />
        )}
      </section>

    </div>
    </div>

    <GamesListSheet
      data={{
        games: gamesData?.items ?? [],
        total: gamesData?.total ?? 0,
        syncStatus,
        analyzeAllProgress,
        pendingAnalyzeCount: pendingCount,
      }}
      state={{
        open: gamesOpen,
        status: gamesStatus,
        filters: gamesFilters,
        isSelected: id => id === selectedGameId,
        analyzeStatus,
        analyzeProgress,
        sync: syncStatusPhase,
        analyzeAll: analyzeAllStatus,
      }}
      actions={{
        onOpenChange: setGamesOpen,
        onFiltersChange: patch => setGamesFilters(prev => ({ ...prev, ...patch })),
        onSelect: setPageModeGameReview,
        onAnalyze: analyze,
        onToggleReviewed: setGameReviewed,
        onSync: triggerSync,
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
      open={drillDialogOpen}
      onOpenChange={open => { if (!open) setDrillDialogOpen(false) }}
      mode="drill"
      onModeChange={startTrainSession}
      coverage={coverage}
      dueCards={dueCards}
    />
    </>
  )
}
