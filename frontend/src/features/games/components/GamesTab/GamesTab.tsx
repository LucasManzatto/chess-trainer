import { BoardPanel } from '../../../../components/ChessBoard/BoardPanel'
import { MoveList } from '../../../../components/MoveList/MoveList'
import { PanelSection } from '../../../../components/PanelSection'
import { useGamesTab } from '../../hooks/useGamesTab'
import { GamesList } from '../GamesList/GamesList'
import { SyncControls } from './SyncControls'

export function GamesTab() {
  const {
    username,
    games,
    gamesTotal,
    gamesLoading,
    selectedGame,
    selectGame,
    filters,
    setResult,
    setColor,
    setTimeClass,
    setEco,
    syncStatus,
    isRunning,
    triggerSync,
    moveSans,
    selectedMoveIndex,
    lastMove,
    currentFen,
    boardOrientation,
    flipOrientation,
    onMoveClick,
  } = useGamesTab()

  return (
    <div className="grid grid-cols-[300px_1fr_220px_260px] gap-6 pt-6 pr-6 pb-6 h-full w-full overflow-hidden">
      {/* Col 1: Games list */}
      <section className="overflow-y-hidden min-h-0 bg-white/[0.03] border border-white/[0.06] flex flex-col">
        <GamesList
          games={games}
          isLoading={gamesLoading}
          selectedId={selectedGame?.id ?? null}
          username={username}
          filters={filters}
          total={gamesTotal}
          onSelect={selectGame}
          onResultChange={setResult}
          onColorChange={setColor}
          onTimeClassChange={setTimeClass}
          onEcoChange={setEco}
        />
      </section>

      {/* Col 2: Board */}
      <section className="flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <BoardPanel
          fen={currentFen}
          orientation={boardOrientation}
          onFlipOrientation={flipOrientation}
          interactive={false}
          lastMove={lastMove}
          title={
            <div className="flex items-center justify-between w-full gap-2">
              <div className="text-sm text-gray-400 truncate">
                {selectedGame ? `${selectedGame.white_username} vs ${selectedGame.black_username}` : ''}
              </div>
              <SyncControls isRunning={isRunning} syncStatus={syncStatus} onSync={triggerSync} />
            </div>
          }
        />
      </section>

      {/* Col 3: Move list */}
      <PanelSection title="Moves">
        <div className="flex-1 min-h-0 overflow-hidden">
          <MoveList
            moves={moveSans}
            selectedIndex={selectedMoveIndex < moveSans.length ? selectedMoveIndex : null}
            onMoveClick={onMoveClick}
            showHeader={false}
          />
        </div>
      </PanelSection>

      {/* Col 4: Analysis placeholder */}
      <PanelSection title="Analysis">
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
          Engine analysis coming soon
        </div>
      </PanelSection>
    </div>
  )
}
