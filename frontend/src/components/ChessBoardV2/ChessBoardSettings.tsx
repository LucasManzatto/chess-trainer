import { useState } from 'react'
import { useChessBoardStore } from './store/chessBoardStore'
import { GearIcon, FlipIcon, EyeIcon, CloseIcon } from '../icons'

export function ChessBoardSettings() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const flipOrientation = useChessBoardStore(s => s.flipOrientation)
  const showThreats = useChessBoardStore(s => s.showThreats)
  const setShowThreats = useChessBoardStore(s => s.setShowThreats)
  const boardSize = useChessBoardStore(s => s.boardSize)
  const setBoardSize = useChessBoardStore(s => s.setBoardSize)

  return (
    <>
      <div className="absolute top-0 left-full ml-1 flex flex-col gap-1 z-10">
        <button
          className={`p-1.5 rounded bg-black/40 hover:bg-black/60 transition-colors ${drawerOpen ? 'text-white' : 'text-white/70 hover:text-white'}`}
          onClick={() => setDrawerOpen(o => !o)}
          title="Settings"
        >
          <GearIcon size={14} />
        </button>
        <button
          className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
          onClick={flipOrientation}
          title="Flip board"
        >
          <FlipIcon size={14} />
        </button>
        <button
          className={`p-1.5 rounded bg-black/40 hover:bg-black/60 transition-colors ${showThreats ? 'text-white' : 'text-white/70 hover:text-white'}`}
          onClick={() => setShowThreats(!showThreats)}
          title={showThreats ? 'Hide threats' : 'Show threats'}
        >
          <EyeIcon size={14} />
        </button>
      </div>

      {drawerOpen && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-0 right-0 bottom-0 w-48 bg-gray-900/95 border-l border-white/10 pointer-events-auto flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-xs font-medium text-white/80">Settings</span>
              <button
                className="text-white/50 hover:text-white transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-3">
              <label className="flex flex-col gap-2">
                <span className="text-xs text-white/60">Board size</span>
                <input
                  type="range"
                  min={240}
                  max={800}
                  step={8}
                  value={boardSize}
                  onChange={e => setBoardSize(Number(e.target.value))}
                  className="w-full accent-white/80"
                />
                <span className="text-xs text-white/40 text-right">{boardSize}px</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
