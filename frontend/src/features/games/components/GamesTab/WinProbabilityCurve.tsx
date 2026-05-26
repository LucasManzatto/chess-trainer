type WinProbabilityCurveProps = {
  timeline: number[]
  criticalMoveIndices: number[]
}

export function WinProbabilityCurve({ timeline, criticalMoveIndices }: WinProbabilityCurveProps) {
  if (timeline.length < 2) return null

  const W = 220
  const H = 64
  const MID = H / 2

  const xStep = W / (timeline.length - 1)
  const toY = (pct: number) => H - (pct / 100) * H

  const points = timeline.map((pct, i) => ({ x: i * xStep, y: toY(pct) }))
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${pathData} L${W},${H} L0,${H} Z`

  return (
    <div className="px-3 py-2 border-b border-white/[0.06]">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Eval</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <defs>
          <clipPath id="wpc-above">
            <rect x="0" y="0" width={W} height={MID} />
          </clipPath>
          <clipPath id="wpc-below">
            <rect x="0" y={MID} width={W} height={MID} />
          </clipPath>
        </defs>
        <path d={areaPath} fill="rgba(255,255,255,0.10)" clipPath="url(#wpc-above)" />
        <path d={areaPath} fill="rgba(0,0,0,0.25)" clipPath="url(#wpc-below)" />
        <line x1={0} y1={MID} x2={W} y2={MID} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
        <path d={pathData} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        {criticalMoveIndices.map(idx => {
          const x = ((idx + 1) * xStep).toFixed(1)
          return (
            <line key={idx} x1={x} y1={0} x2={x} y2={H} stroke="rgba(251,191,36,0.45)" strokeWidth="1" />
          )
        })}
      </svg>
    </div>
  )
}
