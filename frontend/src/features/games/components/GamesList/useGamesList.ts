import { useState } from 'react'
import type { GamesFilters } from '../../types'

const DEFAULT_FILTERS: GamesFilters = {
  result: null,
  color: null,
  time_class: null,
  eco: '',
}

export function useGamesList() {
  const [filters, setFilters] = useState<GamesFilters>(DEFAULT_FILTERS)

  function setResult(result: GamesFilters['result']) {
    setFilters(f => ({ ...f, result }))
  }

  function setColor(color: GamesFilters['color']) {
    setFilters(f => ({ ...f, color }))
  }

  function setTimeClass(time_class: GamesFilters['time_class']) {
    setFilters(f => ({ ...f, time_class }))
  }

  function setEco(eco: string) {
    setFilters(f => ({ ...f, eco }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  return { filters, setResult, setColor, setTimeClass, setEco, resetFilters }
}
