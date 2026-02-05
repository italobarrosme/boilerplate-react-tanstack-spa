import { createRouter } from '@tanstack/react-router'

import type { AuthContextValue } from '@/infra/auth'
import { routeTree } from './routeTree.gen'

export type RouterContext = {
  auth: AuthContextValue
}

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  context: {
    auth: {
      isAuthenticated: false,
      isLoading: false,
      session: null,
      user: null,
      error: null,
    } as AuthContextValue,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
