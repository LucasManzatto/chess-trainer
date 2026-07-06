import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/openings')({
  component: OpeningsLayout,
})

function OpeningsLayout() {
  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </main>
  )
}
