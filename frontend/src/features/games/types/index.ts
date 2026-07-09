import type { GameAnalysis, MoveAnalysis, MoveClassification } from '../../../lib/chess/types'

export type { GameAnalysis, MoveAnalysis, MoveClassification }

export type UserProfile = {
  user_id: string
  chess_com_username: string | null
  sync_status: 'idle' | 'running' | 'done' | 'error'
  sync_progress: SyncProgress | null
  last_sync_at: string | null
}

export type SyncProgress = {
  current_month: number
  total_months: number
  games_added: number
}

export type SyncStatus = {
  status: 'idle' | 'running' | 'done' | 'error'
  current_month: number | null
  total_months: number | null
  games_added: number | null
  last_sync_at: string | null
}

export type AnalyzeStatus = 'idle' | 'running' | 'done' | 'error'

export type AnalyzeStatusResponse = {
  status: AnalyzeStatus
  current: number | null
  total: number | null
}

export type Game = {
  id: number
  chess_com_id: string
  white_username: string
  white_rating: number | null
  black_username: string
  black_rating: number | null
  user_color: 'white' | 'black'
  result: 'win' | 'loss' | 'draw'
  termination: string | null
  time_class: string | null
  time_control: string | null
  eco: string | null
  opening_name: string | null
  moves: string[]
  pgn: string
  played_at: string | null
  analysis: GameAnalysis | null
  reviewed: boolean
  critical_moves: number[] | null
}

export type GamesListResponse = {
  items: Game[]
  total: number
}

export type GamesFilters = {
  result: 'win' | 'loss' | 'draw' | null
  color: 'white' | 'black' | null
  has_critical_moves: boolean | null
  reviewed: boolean | null
  first_critical_move: number | null
}
