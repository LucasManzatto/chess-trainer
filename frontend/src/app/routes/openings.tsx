import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useFavorites } from '../../features/openings/hooks/useFavorites'

export const Route = createFileRoute('/openings')({
  component: OpeningsLayout,
})

const TABS = [
  { label: 'Browse', to: '/openings/browse' as const },
  { label: 'Browse V2', to: '/openings/browse_v2' as const },
  { label: 'Drill', to: '/openings/drill' as const },
]

function OpeningsLayout() {
  useFavorites()

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="border-b border-white/10 px-4 flex gap-1 pt-2">
        {TABS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            search={(prev) => ({ modal: prev.modal })}
            activeProps={{ className: 'bg-white/10 text-white border-b-2 border-amber-400' }}
            inactiveProps={{ className: 'text-gray-400 hover:text-white hover:bg-white/5' }}
            className="px-4 py-2 text-sm font-medium rounded-t transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </main>
  )
}
