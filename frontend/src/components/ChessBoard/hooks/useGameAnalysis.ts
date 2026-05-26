import { useState, useRef, useCallback, useEffect } from 'react'
import type { GameAnalysis, MoveAnalysis } from '../types'
import { gamesApi } from '../../../features/games/api'
import { classifyMove, cpToWinPercent, computeAccuracy, evalFen, createStockfishWorker } from '../../../chess'
import sfUrl from 'stockfish/bin/stockfish-18-lite-single.js?url'
import sfWasmUrl from 'stockfish/bin/stockfish-18-lite-single.wasm?url'

export type AnalyzeStatus = 'idle' | 'running' | 'done' | 'error'

type UseGameAnalysisResult = {
  analyze: () => void
  status: AnalyzeStatus
  progress: { current: number; total: number }
  analysis: GameAnalysis | null
}

export function useGameAnalysis(
  allFens: string[],
  allMoves: string[],
  gameId: number | null,
  depth = 18,
  onComplete?: () => void,
): UseGameAnalysisResult {
  const [status, setStatus] = useState<AnalyzeStatus>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    abortRef.current = true
    setStatus('idle')
    setAnalysis(null)
    setProgress({ current: 0, total: 0 })
  }, [gameId])

  const analyze = useCallback(async () => {
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

      const savedGame = await gamesApi.saveAnalysis(gameId, result)
      const saved = savedGame.analysis ?? result
      setAnalysis(saved)
      setStatus('done')
      onComplete?.()
    } catch {
      if (!abortRef.current) setStatus('error')
    } finally {
      worker.terminate()
    }
  }, [allFens, allMoves, gameId, depth, status, onComplete])

  return { analyze, status, progress, analysis }
}
