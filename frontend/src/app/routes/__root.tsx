import { useEffect } from 'react'
import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui'
import { authClient } from '../../lib/auth'
import { TopNav } from '../../components/TopNav/TopNav'
import { LoginModal } from '../../components/LoginModal/LoginModal'
import { ErrorBoundary } from '../../components/ErrorBoundary'

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => ({
    modal: search.modal === 'login' ? ('login' as const) : undefined,
  }),
  component: RootLayout,
})

function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleUnauthorized() {
      navigate({ to: '.', search: (prev) => ({ ...prev, modal: 'login' as const }) })
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  return (
    <NeonAuthUIProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authClient={authClient as any}
      navigate={(href) => navigate({ to: href })}
      credentials={{ forgotPassword: true }}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <TopNav />
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        <LoginModal />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </NeonAuthUIProvider>
  )
}
