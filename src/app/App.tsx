import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'

import { AuthProvider, useAuth } from '@/infra/auth/AuthContext'
import { setAuthErrorHandler } from '@/infra/http/ky-client'
import { queryClient } from '@/infra/query/query-client'
import { router } from './router'

function InnerApp() {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}

export function App() {
  // Set up global auth error handler
  setAuthErrorHandler((status) => {
    if (status === 401) {
      // Redirect to login on 401
      window.location.href = '/auth/login'
    } else if (status === 403) {
      // Redirect to forbidden page on 403
      window.location.href = '/forbidden'
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
