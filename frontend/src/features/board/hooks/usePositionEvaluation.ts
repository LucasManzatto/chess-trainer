import { useState, useEffect, useRef, useCallback } from 'react'
import type { EvaluationResult, EvaluationScore } from '../../../lib/chess/types'
import { parseScore, toWhitePerspective, createStockfishWorker } from '../../../features/engine'
import sfUrl from 'stockfish/bin/stockfish-18-lite-single.js?url'
import sfWasmUrl from 'stockfish/bin/stockfish-18-lite-single.wasm?url'

const TARGET_DEPTH = 18

type EngineState = {
  score: EvaluationScore | undefined
  bestMove: string | undefined
  scoredFen: string
  error: boolean
}

export function usePositionEvaluation(fen: string | undefined): EvaluationResult {
  const [engineState, setEngineState] = useState<EngineState>({
    score: undefined,
    bestMove: undefined,
    scoredFen: '',
    error: false,
  })

  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingFenRef = useRef<string | null>(null)
  const currentSearchFenRef = useRef<string>('')
  const searchActiveRef = useRef(false)
  const awaitingBestMoveRef = useRef(false)

  const beginSearch = useCallback((targetFen: string) => {
    const worker = workerRef.current
    if (!worker) return
    if (searchActiveRef.current) {
      pendingFenRef.current = targetFen
      worker.postMessage('stop')
      awaitingBestMoveRef.current = true
      return
    }
    currentSearchFenRef.current = targetFen
    worker.postMessage(`position fen ${targetFen}`)
    worker.postMessage(`go depth ${TARGET_DEPTH}`)
    searchActiveRef.current = true
  }, [])

  useEffect(() => {
    let cancelled = false

    createStockfishWorker(sfUrl, sfWasmUrl).then(worker => {
      if (cancelled) {
        worker.terminate()
        return
      }

      workerRef.current = worker
      readyRef.current = true

      worker.onerror = () => {
        setEngineState({ score: undefined, bestMove: undefined, scoredFen: '', error: true })
      }

      worker.onmessage = (e: MessageEvent<string>) => {
        const line = e.data

        if (line.startsWith('bestmove')) {
          const wasAwaiting = awaitingBestMoveRef.current
          awaitingBestMoveRef.current = false
          searchActiveRef.current = false
          if (!wasAwaiting) {
            const bmMatch = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/)
            if (bmMatch) {
              const completedFen = currentSearchFenRef.current
              setEngineState(s => s.bestMove !== undefined ? s : { ...s, bestMove: bmMatch[1], scoredFen: completedFen })
            }
          }
          const pending = pendingFenRef.current
          if (pending !== null) {
            pendingFenRef.current = null
            beginSearch(pending)
          }
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
              const pvMatch = line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/)
              const bestMove = pvMatch?.[1]
              setEngineState({ score, bestMove, scoredFen, error: false })
            }
          }
        }
      }

      const pending = pendingFenRef.current
      if (pending !== null) {
        pendingFenRef.current = null
        beginSearch(pending)
      }
    }).catch(() => {
      if (!cancelled) {
        queueMicrotask(() => setEngineState({ score: undefined, bestMove: undefined, scoredFen: '', error: true }))
      }
    })

    return () => {
      cancelled = true
      workerRef.current?.terminate()
      workerRef.current = null
      readyRef.current = false
      searchActiveRef.current = false
      awaitingBestMoveRef.current = false
    }
  }, [beginSearch])

  useEffect(() => {
    if (fen === undefined) {
      queueMicrotask(() => setEngineState(s => s.score === undefined && s.bestMove === undefined ? s : { score: undefined, bestMove: undefined, scoredFen: '', error: false }))
      return
    }

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

  const isLoading = fen !== undefined && engineState.scoredFen !== fen && !engineState.error

  return { score: engineState.score, bestMove: engineState.bestMove, isLoading, error: engineState.error }
}
