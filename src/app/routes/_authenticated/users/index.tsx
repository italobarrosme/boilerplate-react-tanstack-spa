import { createFileRoute } from '@tanstack/react-router'

import { UsersListPage } from '@/modules/users/components/UsersListPage'

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersListPage,
})
