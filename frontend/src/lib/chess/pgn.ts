import { Chess } from 'chess.js'
import type { Annotation, AnnotationColor, GameMetadata } from './types'

type ParsePgnSuccess = { ok: true; moves: string[]; metadata: GameMetadata }
type ParsePgnFailure = { ok: false; error: string }

// ─── Annotation parse / serialize ─────────────────────────────────────────────

/** Extracts arrows (%cal), circles (%csl), and plain text from a PGN comment string. */
export function parseAnnotation(comment: string): Annotation {
  const arrows = [...comment.matchAll(/\[%cal ([^\]]+)\]/g)]
    .flatMap(m => m[1].split(','))
    .map(s => ({ color: s[0] as AnnotationColor, from: s.slice(1, 3), to: s.slice(3, 5) }))

  const circles = [...comment.matchAll(/\[%csl ([^\]]+)\]/g)]
    .flatMap(m => m[1].split(','))
    .map(s => ({ color: s[0] as AnnotationColor, square: s.slice(1, 3) }))

  const text = comment.replace(/\[%c[as]l [^\]]+\]/g, '').trim()

  return { arrows, circles, comment: text || undefined }
}

/** Serializes an Annotation back to PGN comment format (`[%cal ...]`, `[%csl ...]`, text). */
export function serializeAnnotation(a: Annotation): string {
  const cal = a.arrows.length
    ? `[%cal ${a.arrows.map(x => `${x.color}${x.from}${x.to}`).join(',')}]`
    : ''
  const csl = a.circles.length
    ? `[%csl ${a.circles.map(x => `${x.color}${x.square}`).join(',')}]`
    : ''
  return [cal, csl, a.comment].filter(Boolean).join(' ')
}

/** Parses a PGN string into moves (SAN array) and game metadata. Headers with value `"?"` are treated as absent. */
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
