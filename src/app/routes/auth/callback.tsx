import { createFileRoute } from '@tanstack/react-router'

import { CallbackPage } from '@/modules/auth/components/CallbackPage'

export const Route = createFileRoute('/auth/callback')({
  component: CallbackPage,
})
