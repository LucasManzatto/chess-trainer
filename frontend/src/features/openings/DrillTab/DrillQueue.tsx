import type { DrillQueueItem } from '../types'

type Props = {
  queue: DrillQueueItem[]
  onStart: (item: DrillQueueItem) => void
}

export function DrillQueue({ queue, onStart }: Props) {
  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-gray-400 text-lg font-semibold">Queue complete</p>
          <p className="text-gray-600 text-sm">No openings due for review today.</p>
          <p className="text-gray-600 text-sm">
            Add openings from the{' '}
            <a href="/openings/?tab=browse" className="text-amber-400 hover:underline">Browse tab</a>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white font-semibold">{queue.length} opening{queue.length !== 1 ? 's' : ''} due</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.map(item => (
          <div key={item.opening_id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5">
            <div>
              <span className="text-xs font-mono text-amber-400 mr-2">{item.eco}</span>
              <span className="text-sm text-white">{item.name}</span>
              <span className="ml-2 text-xs text-gray-500">rep #{item.repetitions}</span>
            </div>
            <button
              onClick={() => onStart(item)}
              className="px-3 py-1 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded transition-colors"
            >
              Drill
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
