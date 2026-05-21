import { createFileRoute } from '@tanstack/react-router'
import { AuthView } from '@neondatabase/neon-js/auth/react/ui'

export const Route = createFileRoute('/auth/$pathname')({
  component: AuthPage,
})

function AuthPage() {
  const { pathname } = Route.useParams()
  return (
    <main className="flex flex-col items-center justify-center flex-1 p-4">
      <AuthView pathname={pathname} redirectTo="/" />
    </main>
  )
}
