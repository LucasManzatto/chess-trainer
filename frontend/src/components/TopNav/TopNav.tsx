import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '../../lib/auth'
import { useRouteMemoryStore } from '../../stores/routeMemoryStore'
import { Button } from '@/components/ui/button'

const navLinks = [
  { to: '/' as const, label: 'Free Play', exact: true },
  { to: '/puzzles' as const, label: 'Puzzles', exact: false },
  { to: '/openings' as const, label: 'Openings', exact: false },
  { to: '/train' as const, label: 'Train', exact: false },
]

export function TopNav() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const routeMemory = useRouteMemoryStore((s) => s.routes)

  return (
    <header className="flex items-center justify-between px-5 h-13 border-b border-white/[0.08] bg-[#0e0e22]/90 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          search={(prev) => ({ ...routeMemory['/'], modal: (prev as { modal?: 'login' }).modal })}
          className="flex items-center gap-2 select-none"
        >
          <span className="text-amber-400 text-xl leading-none">♟</span>
          <span
            className="text-white font-semibold tracking-tight leading-none"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
          >
            Chess Trainer
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {navLinks.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              search={(prev) => ({ ...routeMemory[to], modal: (prev as { modal?: 'login' }).modal })}
              activeProps={{ className: 'text-white bg-white/10' }}
              inactiveProps={{ className: 'text-white/50 hover:text-white/80 hover:bg-white/5' }}
              activeOptions={{ exact }}
              className="px-3 py-1.5 rounded text-sm transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <Link
            to="/account/$pathname"
            params={{ pathname: 'settings' }}
            search={{ modal: undefined }}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-amber-500/70 flex items-center justify-center text-xs font-bold text-white">
              {session.user.name?.charAt(0).toUpperCase() ?? session.user.email?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <span className="hidden sm:inline">{session.user.name ?? session.user.email}</span>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/', search: { modal: 'login' } })}
            className="bg-transparent border-amber-500/30 text-amber-300/80 hover:bg-transparent hover:border-amber-400/60 hover:text-amber-200"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}
