import { createFileRoute } from '@tanstack/react-router'

import { DesignSystemPage } from '@/modules/design-system/components/DesignSystemPage'

export const Route = createFileRoute('/_authenticated/design-system/')({
  component: DesignSystemPage,
})
