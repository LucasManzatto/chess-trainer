import { createFileRoute } from '@tanstack/react-router'
import { AccountView } from '@neondatabase/neon-js/auth/react/ui'

export const Route = createFileRoute('/account/$pathname')({
  component: AccountPage,
})

function AccountPage() {
  const { pathname } = Route.useParams()
  return (
    <main className="flex flex-col items-center justify-center flex-1 p-4">
      <AccountView pathname={pathname} />
    </main>
  )
}
