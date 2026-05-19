import { useState } from 'react'
import { ChessBoard } from './components/ChessBoard'
import { MoveList } from './components/MoveList'
import type { MoveResult } from './components/ChessBoard'

function App() {
  const [moves, setMoves] = useState<MoveResult[]>([])

  function handleMove(move: MoveResult) {
    setMoves(prev => [...prev, move])
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
        <div className="w-full md:max-w-[560px]">
          <ChessBoard onMove={handleMove} />
        </div>
        <div className="w-full md:w-64 md:min-h-[560px] bg-white/5 rounded-lg overflow-hidden">
          <MoveList moves={moves} />
        </div>
      </div>
    </main>
  )
}

export default App
