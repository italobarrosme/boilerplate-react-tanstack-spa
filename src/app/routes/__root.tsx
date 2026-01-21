import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

import type { AuthContextValue } from '@/infra/auth'
import { LoadingScreen } from '@/infra/ui/components/LoadingScreen'

type RouterContext = {
  auth: AuthContextValue
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

// Lazy load devtools in development only
const RouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    )

function RootLayout() {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
      <Suspense>
        <RouterDevtools position="bottom-right" />
      </Suspense>
    </>
  )
}
