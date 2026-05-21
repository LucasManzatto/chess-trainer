import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '../../lib/auth'

const navLinks = [
  { to: '/' as const, label: 'Free Play', exact: true },
  { to: '/puzzles' as const, label: 'Puzzles', exact: false },
  { to: '/openings' as const, label: 'Openings', exact: false },
  { to: '/dashboard' as const, label: 'Dashboard', exact: false },
  { to: '/games' as const, label: 'Games', exact: false },
]

export function TopNav() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-white/10 bg-[#12122a] shrink-0">
      <nav className="flex items-center gap-1">
        {navLinks.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            search={{ modal: undefined }}
            activeProps={{ className: 'text-white bg-white/10' }}
            inactiveProps={{ className: 'text-gray-400 hover:text-gray-200 hover:bg-white/5' }}
            activeOptions={{ exact }}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <Link
            to="/account/$pathname"
            params={{ pathname: 'settings' }}
            search={{ modal: undefined }}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center text-xs font-bold text-white">
              {session.user.name?.charAt(0).toUpperCase() ?? session.user.email?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <span className="hidden sm:inline">{session.user.name ?? session.user.email}</span>
          </Link>
        ) : (
          <button
            onClick={() => navigate({ to: '/', search: { modal: 'login' } })}
            className="px-3 py-1.5 rounded text-sm font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
