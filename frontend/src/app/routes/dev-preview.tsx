import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { GameList, GamesListHeader } from '../../features/games/components/GamesList/GamesList'
import type { Game, GamesFilters } from '../../features/games/types'

export const Route = createFileRoute('/dev-preview')({
  component: DevPreview,
})

const MOCK_GAMES: Game[] = [
  {
    id: 1, chess_com_id: 'a', white_username: 'me', white_rating: 1500,
    black_username: 'opponent1', black_rating: 1520, user_color: 'white',
    result: 'win', termination: 'checkmate', time_class: 'blitz', time_control: '300',
    eco: 'C50', opening_name: 'Italian Game', moves: [], pgn: '', played_at: null, analysis: null,
    reviewed: false, critical_moves: null,
  },
  {
    id: 2, chess_com_id: 'b', white_username: 'opponent2', white_rating: 1600,
    black_username: 'me', black_rating: 1500, user_color: 'black',
    result: 'loss', termination: 'resignation', time_class: 'rapid', time_control: '600',
    eco: 'B20', opening_name: 'Sicilian Defense', moves: [], pgn: '', played_at: null,
    analysis: { moves: [] } as unknown as Game['analysis'],
    reviewed: false, critical_moves: null,
  },
  {
    id: 3, chess_com_id: 'c', white_username: 'me', white_rating: 1500,
    black_username: 'opponent3', black_rating: 1500, user_color: 'white',
    result: 'draw', termination: 'agreement', time_class: 'bullet', time_control: '60',
    eco: null, opening_name: null, moves: [], pgn: '', played_at: null, analysis: null,
    reviewed: false, critical_moves: null,
  },
]

function DevPreview() {
  const [selected, setSelected] = useState<number | null>(null)
  const [games] = useState(MOCK_GAMES)
  const [emptyMode, setEmptyMode] = useState(false)
  const [filters, setFilters] = useState<GamesFilters>({ result: null, color: null, has_critical_moves: null, reviewed: null, first_critical_move: null })

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <button className="p-2 text-xs underline" onClick={() => setEmptyMode(e => !e)}>
        toggle empty ({String(emptyMode)})
      </button>
      <div className="flex w-80 flex-col border-r border-border">
        <GamesListHeader
          total={games.length}
          filters={filters}
          onFiltersChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
        />
        <GameList
          games={emptyMode ? [] : games}
          isSelected={id => id === selected}
          analyzeStatus={selected === 2 ? 'running' : 'idle'}
          analyzeProgress={{ current: 1, total: 3 }}
          onSelect={game => setSelected(game.id)}
          onAnalyze={() => alert('analyze clicked')}
          onToggleReviewed={(id, reviewed) => alert(`toggle reviewed ${id} -> ${reviewed}`)}
        />
      </div>
    </div>
  )
}
