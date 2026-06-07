import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/openings/')({
  beforeLoad: () => {
    throw redirect({ to: '/openings/browse', search: { modal: undefined } })
  },
})
