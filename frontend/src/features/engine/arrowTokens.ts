// Win-rate is a SCORE from your color's perspective: (wins + 0.5*draws) / total.
// All * sq values are fractions of the square edge in px.
// If you change the board's square colors, re-check the green "good" arrow contrast.

export const arrowTokens = {
  // Shared — rank badge + percentage label
  badge: {
    diameter: 0.34,          // * sq  → ~22px
    bg: '#1E293B',           // slate-900
    text: '#FFFFFF',
    fontSize: 0.19,          // * sq  → ~12px
  },
  label: {                   // e.g. the "46%" pill near the arrowhead
    bg: '#1E293B',
    text: '#FFFFFF',
    fontSizePx: 12,
    paddingPx: { y: 1, x: 7 },
    radiusPx: 8,
  },

  // OPPONENT moves — frequency. Neutral hue, NO good/bad meaning.
  // Weight comes from frequency, not color. f = freq / topFreq  (0..1)
  opponent: {
    color: '#475569',                                   // slate-600, same hue for every arrow
    opacity: (f: number) => Math.min(1, 0.35 + 0.65 * f), // ~0.35 (rare) → 1.0 (most common)
    thicknessPx: (f: number, sq: number) =>
      Math.max(4, sq * (0.10 + 0.12 * f)),              // ~6px → ~14px at sq=64
    rankBadge: true,                                    // 1, 2, 3… by frequency
  },

  // YOUR moves — win-rate. Color carries the meaning; thickness is uniform.
  mine: {
    opacity: 0.92,
    thicknessPx: (sq: number) => sq * 0.18,             // ~11px, same for all (you're choosing, not ranking by size)
    outline: { color: '#FFFFFF', widthPx: (sq: number) => Math.max(1.5, sq * 0.03) }, // pops on same-color squares

    minGamesToTrust: 50,                                // below this → lowSample, ignore the bands

    // resolved top→bottom on the SCORE
    bands: [
      { name: 'good', when: (s: number) => s >= 0.55, color: '#2E9E5B' }, // green
      { name: 'even', when: (s: number) => s >= 0.45, color: '#E0A020' }, // amber
      { name: 'poor', when: (s: number) => s <  0.45, color: '#D24B4A' }, // red
    ],

    lowSample: {                                        // too few games to trust the %
      fill: 'none',
      stroke: '#94A3B8',                                // slate-400
      dashPx: [6, 4],
      strokeWidthPx: 2,
      showGameCount: true,
    },

    unsound: {                                          // engine flags it losing/unsound — overrides everything
      color: '#791F1F',                                 // deep red, distinct from the 'poor' red
      icon: 'alert-triangle',
    },
  },
} as const;
