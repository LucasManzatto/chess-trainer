import { useState } from 'react'

type ImportResult = { ok: true } | { ok: false; error: string }

type PgnImportPanelProps = {
  onImport: (pgn: string) => ImportResult
  onClose: () => void
}

export function PgnImportPanel({ onImport, onClose }: PgnImportPanelProps) {
  const [pgn, setPgn] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    const result = onImport(pgn)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-2">
      <textarea
        className="w-full h-32 bg-white/10 text-gray-100 text-xs font-mono rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder-gray-500"
        placeholder="Paste PGN here…"
        value={pgn}
        onChange={e => setPgn(e.target.value)}
        spellCheck={false}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={handleSubmit}
        className="self-end bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm px-3 py-1 rounded transition-colors"
      >
        Import
      </button>
    </div>
  )
}
