import { Chess } from 'chess.js'
import type { GameMetadata } from './types'

type ParsePgnSuccess = { ok: true; moves: string[]; metadata: GameMetadata }
type ParsePgnFailure = { ok: false; error: string }

export function parsePgn(pgn: string): ParsePgnSuccess | ParsePgnFailure {
  if (!pgn.trim()) return { ok: false, error: 'PGN is empty.' }
  try {
    const chess = new Chess()
    chess.loadPgn(pgn)
    const history = chess.history({ verbose: true })
    if (history.length === 0) return { ok: false, error: 'PGN contains no moves.' }
    const headers = chess.header()
    const header = (key: string) => {
      const val = headers[key]
      return !val || val === '?' ? undefined : val
    }
    return {
      ok: true,
      moves: history.map(m => m.san),
      metadata: {
        white: header('White'),
        black: header('Black'),
        event: header('Event'),
        date: header('Date'),
      },
    }
  } catch {
    return { ok: false, error: 'Invalid PGN.' }
  }
}
