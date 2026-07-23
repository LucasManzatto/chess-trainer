type Props = {
  openingName?: string | null
  isExact?: boolean
  className?: string
}

export function PositionName({ openingName, isExact = true, className }: Props) {
  return (
    <span
      className={`${className ?? 'text-lg font-medium tracking-wide text-white/60 truncate select-none'} ${isExact ? '' : 'italic text-white/40'}`}
    >
      {!isExact && openingName ? `≈ ${openingName}` : openingName}
    </span>
  )
}
