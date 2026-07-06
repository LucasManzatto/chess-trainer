import { LayoutListIcon, ChartNoAxesColumnIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PanelToggleButtonsProps = {
  gamesOpen: boolean
  onToggleGames: () => void
  analysisOpen: boolean
  onToggleAnalysis: () => void
  analysisDisabled?: boolean
}

export function PanelToggleButtons({
  gamesOpen,
  onToggleGames,
  analysisOpen,
  onToggleAnalysis,
  analysisDisabled,
}: PanelToggleButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" aria-expanded={gamesOpen} onClick={onToggleGames}>
        <LayoutListIcon /> Games
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-expanded={analysisOpen}
        onClick={onToggleAnalysis}
        disabled={analysisDisabled}
      >
        <ChartNoAxesColumnIcon /> Analysis
      </Button>
    </div>
  )
}
