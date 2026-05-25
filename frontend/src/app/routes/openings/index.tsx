import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { BrowseTab } from '../../../features/openings/components/BrowseTab/BrowseTab'
import { ExploreTab } from '../../../features/openings/components/ExploreTab/ExploreTab'
import { DrillTab } from '../../../features/openings/components/DrillTab/DrillTab'
import { useFavorites } from '../../../features/openings/hooks/useFavorites'

const searchSchema = z.object({
  tab: z.enum(['browse', 'explore', 'drill']).default('browse').catch('browse'),
})

export const Route = createFileRoute('/openings/')({
  validateSearch: searchSchema,
  component: OpeningsPage,
})

type Tab = 'browse' | 'explore' | 'drill'

const TABS: { id: Tab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'explore', label: 'Explore' },
  { id: 'drill', label: 'Drill' },
]

function OpeningsPage() {
  const { tab } = useSearch({ from: '/openings/' })
  const navigate = useNavigate()
  useFavorites()

  function setTab(t: Tab) {
    navigate({ to: '/openings/', search: { tab: t }, replace: true })
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="border-b border-white/10 px-4 flex gap-1 pt-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === id
                ? 'bg-white/10 text-white border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'browse' && <BrowseTab />}
        {tab === 'explore' && <ExploreTab />}
        {tab === 'drill' && <DrillTab />}
      </div>
    </main>
  )
}
