import type { MoveClassification } from '../../lib/chess/types'

export function classifyMove(cpLoss: number): MoveClassification {
  if (cpLoss === 0) return 'best'
  if (cpLoss <= 10) return 'excellent'
  if (cpLoss <= 25) return 'good'
  if (cpLoss <= 50) return 'inaccuracy'
  if (cpLoss <= 100) return 'mistake'
  return 'blunder'
}

export function cpToWinPercent(cp: number): number {
  return 50 + 50 * Math.tanh(cp / 600)
}

export function computeAccuracy(winPercentLosses: number[]): number {
  if (winPercentLosses.length === 0) return 100
  const avg = winPercentLosses.reduce((a, b) => a + b, 0) / winPercentLosses.length
  const raw = 103.1668 * Math.exp(-0.04354 * avg) - 3.1669
  return Math.max(0, Math.min(100, raw))
}
