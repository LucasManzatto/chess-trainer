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
      className={`flex flex-col min-h-0 overflow-hidden bg-white/[0.055] border border-white/[0.09] rounded ${className ?? ''}`}
    >
      {title && (
        <div className="px-4 h-11 flex items-center justify-between border-b border-white/[0.08] flex-shrink-0">
          <span
            className="text-white/80 font-semibold tracking-tight"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px' }}
          >
            {title}
          </span>
          {headerAction}
        </div>
      )}
      {children}
    </section>
  )
}
