import { useState, useEffect, useRef, useCallback } from 'react'
import type { EvaluationResult, EvaluationScore } from './types'
// Vite ?url imports — copies files to /assets/ at build time and returns their URLs
import sfUrl from 'stockfish/bin/stockfish-18-lite-single.js?url'
import sfWasmUrl from 'stockfish/bin/stockfish-18-lite-single.wasm?url'

const TARGET_DEPTH = 18

function parseScore(line: string): EvaluationScore | null {
  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  if (cpMatch) return { type: 'cp', value: parseInt(cpMatch[1]) }
  const mateMatch = line.match(/\bscore mate (-?\d+)/)
  if (mateMatch) return { type: 'mate', value: parseInt(mateMatch[1]) }
  return null
}

// Normalizes Stockfish's side-to-move score to white's perspective
function toWhitePerspective(score: EvaluationScore, fen: string): EvaluationScore {
  if (fen.split(' ')[1] === 'b') {
    return { type: score.type, value: -score.value }
  }
  return score
}

type EngineState = {
  score: EvaluationScore | undefined
  // FEN for which `score` is current; used to derive isLoading in render
  scoredFen: string
  error: boolean
}

export function usePositionEvaluation(fen: string | undefined): EvaluationResult {
  const [engineState, setEngineState] = useState<EngineState>({
    score: undefined,
    scoredFen: '',
    error: false,
  })

  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingFenRef = useRef<string | null>(null)
  const currentSearchFenRef = useRef<string>('')
  // True between sending `go` and receiving `bestmove` for that search
  const searchActiveRef = useRef(false)
  // True after sending `stop`; discard info lines until bestmove confirms the stop
  const awaitingBestMoveRef = useRef(false)

  const beginSearch = useCallback((targetFen: string) => {
    const worker = workerRef.current
    if (!worker) return
    if (searchActiveRef.current) {
      // Only stop if a search is genuinely in progress; stopping an idle engine
      // may not produce a bestmove and would stall awaitingBestMoveRef forever.
      worker.postMessage('stop')
      awaitingBestMoveRef.current = true
    }
    searchActiveRef.current = false
    currentSearchFenRef.current = targetFen
    worker.postMessage(`position fen ${targetFen}`)
    worker.postMessage(`go depth ${TARGET_DEPTH}`)
    searchActiveRef.current = true
  }, [])

  useEffect(() => {
    let worker: Worker
    try {
      // Hash tells stockfish where the WASM lives (Vite renames assets on build)
      worker = new Worker(`${sfUrl}#${sfWasmUrl}`)
    } catch {
      // queueMicrotask avoids synchronous setState in effect body
      queueMicrotask(() => setEngineState({ score: undefined, scoredFen: '', error: true }))
      return
    }
    workerRef.current = worker

    worker.onerror = () => {
      setEngineState({ score: undefined, scoredFen: '', error: true })
    }

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = e.data

      if (line === 'uciok') {
        worker.postMessage('isready')
        return
      }

      if (line === 'readyok') {
        readyRef.current = true
        const pending = pendingFenRef.current
        if (pending !== null) {
          pendingFenRef.current = null
          beginSearch(pending)
        }
        return
      }

      if (line.startsWith('bestmove')) {
        awaitingBestMoveRef.current = false
        searchActiveRef.current = false
        return
      }

      if (!awaitingBestMoveRef.current && line.startsWith('info') && line.includes(' score ')) {
        const depthMatch = line.match(/\bdepth (\d+)/)
        const depth = depthMatch ? parseInt(depthMatch[1]) : 0
        if (depth >= TARGET_DEPTH) {
          const raw = parseScore(line)
          if (raw) {
            const score = toWhitePerspective(raw, currentSearchFenRef.current)
            const scoredFen = currentSearchFenRef.current
            setEngineState({ score, scoredFen, error: false })
          }
        }
      }
    }

    worker.postMessage('uci')

    return () => {
      worker.terminate()
      workerRef.current = null
      readyRef.current = false
      searchActiveRef.current = false
      awaitingBestMoveRef.current = false
    }
  }, [beginSearch])

  useEffect(() => {
    if (fen === undefined) return

    // Debounce: wait 300ms after last FEN change before sending to engine.
    // Rapid navigation would otherwise spam stop/go and crash Stockfish WASM.
    const timer = setTimeout(() => {
      if (!readyRef.current) {
        pendingFenRef.current = fen
        return
      }
      pendingFenRef.current = null
      beginSearch(fen)
    }, 300)

    return () => clearTimeout(timer)
  }, [fen, beginSearch])

  // Derive isLoading during render — no setState needed in the FEN effect
  const isLoading = fen !== undefined && engineState.scoredFen !== fen && !engineState.error

  return { score: engineState.score, isLoading, error: engineState.error }
}
