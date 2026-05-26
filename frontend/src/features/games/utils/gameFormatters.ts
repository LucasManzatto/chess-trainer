export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeControlLabel(tc: string | null): string {
  if (!tc) return ''
  if (tc.includes('/')) return ''
  const secs = parseInt(tc.split('+')[0] ?? tc)
  if (isNaN(secs)) return ''
  if (secs < 180) return '⚡'
  if (secs < 600) return '⏱'
  return ''
}
