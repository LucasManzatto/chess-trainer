import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useChessGame } from '../../components/ChessBoard/hooks/useChessGame'
import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { MoveList } from '../../components/MoveList/MoveList'
import { PgnImportPanel } from '../../components/PgnImport/PgnImportPanel'
import { usePositionEvaluation } from '../../components/ChessBoard/hooks/usePositionEvaluation'
import { EvaluationBar } from '../../components/ChessBoard/EvaluationBar'
import { ChessStoreProvider } from '../../components/ChessBoard/ChessStoreProvider'

export const Route = createFileRoute('/')({
  component: FreePage,
})

function FreePage() {
  return <ChessStoreProvider><FreePageInner /></ChessStoreProvider>
}

function FreePageInner() {
  const { config, boardFen, loadFromPgn, gameMetadata } =
    useChessGame({ interactiveAtEnd: true })
  const [showImport, setShowImport] = useState(false)
  const { score, isLoading } = usePositionEvaluation(boardFen)

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
        <div className="w-full md:flex-1 md:max-w-[min(calc(100vh-8rem),700px)] min-w-0 flex flex-row gap-2 self-start">
          <EvaluationBar score={score} isLoading={isLoading} />
          <div className="flex-1">
            <ChessBoard config={config} />
          </div>
        </div>
        <div className="w-full md:w-64 md:shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setShowImport(v => !v)}
            className="self-start text-xs text-gray-400 hover:text-gray-200 border border-white/10 hover:border-white/20 px-2 py-1 rounded transition-colors"
          >
            {showImport ? 'Cancel' : 'Import PGN'}
          </button>
          {showImport && (
            <PgnImportPanel
              onImport={loadFromPgn}
              onClose={() => setShowImport(false)}
            />
          )}
          <div className="flex-1 bg-white/5 rounded-lg overflow-hidden flex flex-col">
            {gameMetadata && (
              <div className="px-3 py-2 border-b border-white/10 text-xs text-gray-400 leading-snug">
                {gameMetadata.white && gameMetadata.black && (
                  <p className="text-gray-200 font-medium">{gameMetadata.white} vs {gameMetadata.black}</p>
                )}
                {gameMetadata.event && <p>{gameMetadata.event}</p>}
                {gameMetadata.date && <p>{gameMetadata.date}</p>}
              </div>
            )}
            <MoveList
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
