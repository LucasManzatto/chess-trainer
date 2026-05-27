import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/games/')({
  beforeLoad: () => {
    throw redirect({ to: '/games/list', search: { modal: undefined } })
  },
})
