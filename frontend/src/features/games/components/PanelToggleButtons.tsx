import { useState, type ComponentType } from 'react'
import { LayoutListIcon, ChartNoAxesColumnIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, TargetIcon, SwordsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type PanelToggleButtonsProps = {
  gamesOpen: boolean
  onToggleGames: () => void
  analysisOpen: boolean
  onToggleAnalysis: () => void
  analysisDisabled?: boolean
  drillOpen: boolean
  onToggleDrill: () => void
  sparOpen: boolean
  onToggleSpar: () => void
}

type NavItem = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  active: boolean
  disabled?: boolean
  onClick: () => void
}

export function PanelToggleButtons({
  gamesOpen,
  onToggleGames,
  analysisOpen,
  onToggleAnalysis,
  analysisDisabled,
  drillOpen,
  onToggleDrill,
  sparOpen,
  onToggleSpar,
}: PanelToggleButtonsProps) {
  const [expanded, setExpanded] = useState(true)

  const items: NavItem[] = [
    { key: 'games', label: 'Games', icon: LayoutListIcon, active: gamesOpen, onClick: onToggleGames },
    { key: 'analysis', label: 'Analysis', icon: ChartNoAxesColumnIcon, active: analysisOpen, disabled: analysisDisabled, onClick: onToggleAnalysis },
    { key: 'drill', label: 'Drill', icon: TargetIcon, active: drillOpen, onClick: onToggleDrill },
    { key: 'spar', label: 'Spar', icon: SwordsIcon, active: sparOpen, onClick: onToggleSpar },
  ]

  return (
    <TooltipProvider>
      <nav
        className={cn(
          'flex h-full flex-shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar py-3 transition-[width] duration-200',
          expanded ? 'w-44 px-2' : 'w-14 items-center px-1.5',
        )}
      >
        <div className="flex flex-1 flex-col gap-1">
          {items.map(({ key, label, icon: Icon, active, disabled, onClick }) =>
            expanded ? (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={onClick}
                disabled={disabled}
                aria-expanded={active}
                className={cn(
                  'w-full justify-start border-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  active && 'bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/20 hover:text-sidebar-primary',
                )}
              >
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            ) : (
              <Tooltip key={key}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onClick}
                      disabled={disabled}
                      aria-expanded={active}
                      aria-label={label}
                      className={cn(
                        'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:border-transparent',
                        active && 'bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/20 hover:text-sidebar-primary',
                      )}
                    />
                  }
                >
                  <Icon />
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ),
          )}
        </div>

        <Button
          variant="ghost"
          size={expanded ? 'sm' : 'icon-sm'}
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
          className={cn(
            'border-transparent text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:border-transparent',
            expanded && 'w-full justify-start',
          )}
        >
          {expanded ? <PanelLeftCloseIcon data-icon="inline-start" /> : <PanelLeftOpenIcon />}
          {expanded && 'Collapse menu'}
        </Button>
      </nav>
    </TooltipProvider>
  )
}
