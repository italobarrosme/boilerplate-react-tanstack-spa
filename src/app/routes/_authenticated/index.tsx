import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/modules/dashboard/components/DashboardPage'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})
