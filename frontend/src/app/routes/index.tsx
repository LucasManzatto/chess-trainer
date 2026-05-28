import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: FreePage,
})

function FreePage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="text-gray-500 text-sm">Free play coming soon</div>
    </main>
  )
}
