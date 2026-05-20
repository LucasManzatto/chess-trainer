import { useGameHistory } from './hooks/useGameHistory'
import { ChessBoard } from './components/ChessBoard'
import { MoveList } from './components/MoveList'

function App() {
  const { moves, handleMove, handleMoveClick, position, interactive, selectedIndex } = useGameHistory()

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
        <div className="w-full md:max-w-[560px]">
          <ChessBoard position={position} interactive={interactive} onMove={handleMove} />
        </div>
        <div className="w-full md:w-64 md:min-h-[560px] bg-white/5 rounded-lg overflow-hidden">
          <MoveList
            moves={moves.map(m => m.san)}
            selectedIndex={selectedIndex}
            onMoveClick={handleMoveClick}
          />
        </div>
      </div>
    </main>
  )
}

export default App
