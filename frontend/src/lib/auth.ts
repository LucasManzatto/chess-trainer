import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'
import { NEON_AUTH_URL } from '../config/env'

export const authClient = createAuthClient(
  NEON_AUTH_URL,
  { adapter: BetterAuthReactAdapter() }
)
