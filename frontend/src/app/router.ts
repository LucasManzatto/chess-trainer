import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { useRouteMemoryStore } from '../stores/routeMemoryStore'

export const router = createRouter({ routeTree })

router.subscribe('onResolved', () => {
  const { pathname, search } = router.state.location
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  useRouteMemoryStore.getState().save(key, search as Record<string, unknown>)
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
