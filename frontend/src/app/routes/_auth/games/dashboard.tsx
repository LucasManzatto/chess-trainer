import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/games/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full gap-2 text-gray-400">
      <h1 className="text-2xl font-semibold text-gray-200">Dashboard</h1>
      <p>Coming soon</p>
    </div>
  )
}
