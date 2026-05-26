import type { EvaluationScore } from './types'

export function parseScore(line: string): EvaluationScore | null {
  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  if (cpMatch) return { type: 'cp', value: parseInt(cpMatch[1]) }
  const mateMatch = line.match(/\bscore mate (-?\d+)/)
  if (mateMatch) return { type: 'mate', value: parseInt(mateMatch[1]) }
  return null
}

export function toWhitePerspective(score: EvaluationScore, fen: string): EvaluationScore {
  if (fen.split(' ')[1] === 'b') return { type: score.type, value: -score.value }
  return score
}

export function createStockfishWorker(sfUrl: string, sfWasmUrl: string): Promise<Worker> {
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

export function evalFen(
  worker: Worker,
  fen: string,
  depth: number,
): Promise<{ score: number; bestMove: string }> {
  return new Promise((resolve, reject) => {
    let latestScore = 0
    let latestBestMove = ''

    const handler = (e: MessageEvent<string>) => {
      const line = e.data

      if (line.startsWith('info') && line.includes(' score ')) {
        const depthMatch = line.match(/\bdepth (\d+)/)
        if (!depthMatch || parseInt(depthMatch[1]) < depth) return

        const raw = parseScore(line)
        if (raw) {
          latestScore = raw.type === 'mate'
            ? (raw.value > 0 ? 30000 : -30000)
            : raw.value
        }

        const pvMatch = line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (pvMatch) latestBestMove = pvMatch[1]
      }

      if (line.startsWith('bestmove')) {
        const bmMatch = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (bmMatch && !latestBestMove) latestBestMove = bmMatch[1]
        worker.removeEventListener('message', handler)
        resolve({ score: toWhitePerspective({ type: 'cp', value: latestScore }, fen).value, bestMove: latestBestMove })
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
