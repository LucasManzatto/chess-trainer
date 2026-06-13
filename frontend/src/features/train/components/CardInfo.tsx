import type { RepertoireCard } from '../types'

interface CardInfoProps {
  card: RepertoireCard
}

export function CardInfo({ card }: CardInfoProps) {
  const lastMoveIndex = card.line.length - 1

  return (
    <div className="flex flex-col gap-2 px-1 w-full select-none">
      {/* Opening name + ECO */}
      <div className="flex items-center gap-2">
        {card.opening_eco && (
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/40 text-xs font-mono">
            {card.opening_eco}
          </span>
        )}
        <span
          className="text-white/90 font-semibold leading-tight truncate"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px' }}
        >
          {card.opening_name ?? 'Unknown Opening'}
        </span>
      </div>

      {/* Line breadcrumb */}
      {card.line.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {card.line.map((move, i) => (
            <span
              key={i}
              className={`text-xs font-mono ${
                i === lastMoveIndex ? 'text-amber-300 font-semibold' : 'text-white/40'
              }`}
            >
              {move}
              {i < lastMoveIndex && <span className="text-white/20 ml-1">·</span>}
            </span>
          ))}
        </div>
      )}

      {/* Plan text */}
      {card.plan && (
        <p className="text-white/40 text-xs italic leading-snug">{card.plan}</p>
      )}
    </div>
  )
}
