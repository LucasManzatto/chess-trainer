import { useState, useRef, useCallback, useEffect } from 'react'
import type { GameAnalysis, MoveAnalysis, MoveClassification } from '../types'
import { gamesApi } from '../../../features/games/api'
import sfUrl from 'stockfish/bin/stockfish-18-lite-single.js?url'
import sfWasmUrl from 'stockfish/bin/stockfish-18-lite-single.wasm?url'

type AnalyzeStatus = 'idle' | 'running' | 'done' | 'error'

type UseGameAnalysisResult = {
  analyze: () => void
  status: AnalyzeStatus
  progress: { current: number; total: number }
  analysis: GameAnalysis | null
}

function classifyMove(cpLoss: number): MoveClassification {
  if (cpLoss === 0) return 'best'
  if (cpLoss <= 10) return 'excellent'
  if (cpLoss <= 25) return 'good'
  if (cpLoss <= 50) return 'inaccuracy'
  if (cpLoss <= 100) return 'mistake'
  return 'blunder'
}

function cpToWinPercent(cp: number): number {
  return 50 + 50 * Math.tanh(cp / 600)
}

function computeAccuracy(winPercentLosses: number[]): number {
  if (winPercentLosses.length === 0) return 100
  const avg = winPercentLosses.reduce((a, b) => a + b, 0) / winPercentLosses.length
  const raw = 103.1668 * Math.exp(-0.04354 * avg) - 3.1669
  return Math.max(0, Math.min(100, raw))
}

function evalFen(worker: Worker, fen: string, depth: number): Promise<{ score: number; bestMove: string }> {
  return new Promise((resolve, reject) => {
    let latestScore = 0
    let latestBestMove = ''

    const handler = (e: MessageEvent<string>) => {
      const line = e.data

      if (line.startsWith('info') && line.includes(' score ')) {
        const depthMatch = line.match(/\bdepth (\d+)/)
        if (!depthMatch || parseInt(depthMatch[1]) < depth) return

        const cpMatch = line.match(/\bscore cp (-?\d+)/)
        const mateMatch = line.match(/\bscore mate (-?\d+)/)
        if (cpMatch) latestScore = parseInt(cpMatch[1])
        else if (mateMatch) latestScore = parseInt(mateMatch[1]) > 0 ? 30000 : -30000

        const pvMatch = line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (pvMatch) latestBestMove = pvMatch[1]
      }

      if (line.startsWith('bestmove')) {
        const bmMatch = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (bmMatch && !latestBestMove) latestBestMove = bmMatch[1]
        worker.removeEventListener('message', handler)

        // Normalize to white's perspective
        const isBlackToMove = fen.split(' ')[1] === 'b'
        const whiteScore = isBlackToMove ? -latestScore : latestScore
        resolve({ score: whiteScore, bestMove: latestBestMove })
      }

      if (line === 'error') {
        worker.removeEventListener('message', handler)
        reject(new Error('Stockfish error'))
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage(`position fen ${fen}`)
    worker.postMessage(`go depth ${depth}`)
  })
}

function initWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new Worker(`${sfUrl}#${sfWasmUrl}`)
    } catch (e) {
      reject(e)
      return
    }

    worker.onerror = () => reject(new Error('Worker init failed'))

    const handler = (e: MessageEvent<string>) => {
      if (e.data === 'uciok') {
        worker.postMessage('isready')
      } else if (e.data === 'readyok') {
        worker.removeEventListener('message', handler)
        resolve(worker)
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage('uci')
  })
}

export function useGameAnalysis(
  allFens: string[],
  gameId: number | null,
  depth = 18,
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
      worker = await initWorker()
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

      // allFens[0] = initial position, allFens[1..n] = after move i
      // scores[i] = eval after allFens[i] from white's perspective
      // allFens has n+1 entries for n moves; game.moves has n entries
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

        // bestMoves[i] is the best move from position allFens[i]
        // The actual move played transitions allFens[i] -> allFens[i+1]
        // We don't have the UCI move of what was played, so use bestMove comparison
        // to determine 'best' classification only when cpLoss === 0
        const classification = classifyMove(cpLoss)

        movesAnalysis.push({
          san: '',  // filled by caller from game.moves
          cp_loss: cpLoss,
          best_move: bestMoves[i],
          classification,
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
      }

      const savedGame = await gamesApi.saveAnalysis(gameId, result)
      const saved = savedGame.analysis ?? result
      setAnalysis(saved)
      setStatus('done')
    } catch {
      if (!abortRef.current) setStatus('error')
    } finally {
      worker.terminate()
    }
  }, [allFens, gameId, depth, status])

  return { analyze, status, progress, analysis }
}
