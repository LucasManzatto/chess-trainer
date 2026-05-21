import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
      <h1 className="text-2xl font-semibold text-gray-200">Dashboard</h1>
      <p>Coming soon</p>
    </main>
  )
}
