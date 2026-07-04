import { useState, useRef, useCallback, useEffect } from 'react'
import type { Game, GameAnalysis, MoveAnalysis } from '../../games/types'
import { classifyMove, cpToWinPercent, computeAccuracy, evalFen } from '../../../lib/chess'
import { buildHistoryFromMoves, INITIAL_FEN } from '../../../lib/chess/history'
import { createStockfishWorker } from '../../../features/engine'
import sfUrl from 'stockfish/bin/stockfish-18-lite-single.js?url'
import sfWasmUrl from 'stockfish/bin/stockfish-18-lite-single.wasm?url'

function buildAllFens(allMoves: string[]): string[] {
  if (allMoves.length === 0) return []
  try {
    return [INITIAL_FEN, ...buildHistoryFromMoves(allMoves).map(h => h.fen)]
  } catch {
    return []
  }
}

export type AnalyzeStatus = 'idle' | 'running' | 'done' | 'error'

type UseGameAnalysisResult = {
  analyze: () => void
  status: AnalyzeStatus
  progress: { current: number; total: number }
  analysis: GameAnalysis | null
}

export function useGameAnalysis(
  game: Game | null,
  saveAnalysis: (gameId: number, analysis: GameAnalysis) => Promise<Game>,
  depth = 18,
  onComplete?: () => void,
): UseGameAnalysisResult {
  const allMoves = game?.moves ?? []
  const gameId = game?.id ?? null
  const [status, setStatus] = useState<AnalyzeStatus>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
  const abortRef = useRef(false)
  const mountedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    abortRef.current = true
    queueMicrotask(() => {
      setStatus('idle')
      setAnalysis(null)
      setProgress({ current: 0, total: 0 })
    })
  }, [gameId])

  const analyze = useCallback(async () => {
    const allFens = buildAllFens(allMoves)
    if (!gameId || allFens.length < 2 || status === 'running') return

    abortRef.current = false
    setStatus('running')
    setProgress({ current: 0, total: allFens.length })
    setAnalysis(null)

    let worker: Worker
    try {
      worker = await createStockfishWorker(sfUrl, sfWasmUrl)
    } catch {
      setStatus('error')
      return
    }

    try {
      const scores: number[] = []
      const bestMoves: string[] = []

      for (let i = 0; i < allFens.length; i++) {
        if (abortRef.current) break
        const { score, bestMove } = await evalFen(worker, allFens[i], depth)
        scores.push(score)
        bestMoves.push(bestMove)
        setProgress({ current: i + 1, total: allFens.length })
      }

      if (abortRef.current) {
        setStatus('idle')
        return
      }

      const moveCount = scores.length - 1
      const movesAnalysis: MoveAnalysis[] = []
      const whiteWinLosses: number[] = []
      const blackWinLosses: number[] = []

      for (let i = 0; i < moveCount; i++) {
        const before = scores[i]
        const after = scores[i + 1]
        const isWhiteMove = i % 2 === 0
        const cpLoss = isWhiteMove
          ? Math.max(0, before - after)
          : Math.max(0, after - before)

        const winLoss = isWhiteMove
          ? Math.max(0, cpToWinPercent(before) - cpToWinPercent(after))
          : Math.max(0, cpToWinPercent(after) - cpToWinPercent(before))

        movesAnalysis.push({
          san: allMoves[i] ?? '',
          cp_loss: cpLoss,
          best_move: bestMoves[i],
          classification: classifyMove(cpLoss),
          score: scores[i + 1],
        })

        if (isWhiteMove) whiteWinLosses.push(winLoss)
        else blackWinLosses.push(winLoss)
      }

      const result: GameAnalysis = {
        moves: movesAnalysis,
        white_accuracy: computeAccuracy(whiteWinLosses),
        black_accuracy: computeAccuracy(blackWinLosses),
        depth,
        analyzed_at: new Date().toISOString(),
        initial_score: scores[0],
      }

      if (abortRef.current) {
        setStatus('idle')
        return
      }
      const savedGame = await saveAnalysis(gameId, result)
      const saved = savedGame.analysis ?? result
      setAnalysis(saved)
      setStatus('done')
      onCompleteRef.current?.()
    } catch {
      if (!abortRef.current) setStatus('error')
    } finally {
      worker.terminate()
    }
  }, [allMoves, gameId, saveAnalysis, depth, status])

  return { analyze, status, progress, analysis }
}
