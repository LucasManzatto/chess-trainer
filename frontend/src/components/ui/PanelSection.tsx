import type { ReactNode } from 'react'

type PanelSectionProps = {
  title?: string
  headerAction?: ReactNode
  children: ReactNode
  className?: string
}

export function PanelSection({ title, headerAction, children, className }: PanelSectionProps) {
  return (
    <section
      className={`flex flex-col min-h-0 overflow-hidden bg-white/[0.03] border border-white/[0.06] ${className ?? ''}`}
    >
      {title && (
        <div className="px-3 h-10 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
          {headerAction}
        </div>
      )}
      {children}
    </section>
  )
}
