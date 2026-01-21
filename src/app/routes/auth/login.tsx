import { createFileRoute } from '@tanstack/react-router'

import { LoginPage } from '@/modules/auth/components/LoginPage'

type LoginSearch = {
  redirect?: string | undefined
}

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
  component: LoginPage,
})
