import { createFileRoute } from '@tanstack/react-router'

import { UserDetailPage } from '@/modules/users/components/UserDetailPage'

export const Route = createFileRoute('/_authenticated/users/$userId')({
  component: UserDetailPage,
})
