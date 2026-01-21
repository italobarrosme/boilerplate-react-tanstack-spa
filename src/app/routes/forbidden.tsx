import { createFileRoute } from '@tanstack/react-router'

import { ForbiddenPage } from '@/modules/auth/components/ForbiddenPage'

export const Route = createFileRoute('/forbidden')({
  component: ForbiddenPage,
})
