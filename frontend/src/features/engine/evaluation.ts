export function cpToWinPercent(cp: number): number {
  return 50 + 50 * Math.tanh(cp / 600)
}
