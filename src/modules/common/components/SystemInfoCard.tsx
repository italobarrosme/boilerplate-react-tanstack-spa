import { cn } from '@/shared/utils'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/infra/ui/components'

export type SystemInfoItem = {
  label: string
  value: string
  valueClassName?: string
}

export type SystemInfoCardProps = {
  title: string
  description: string
  items: SystemInfoItem[]
}

export function SystemInfoCard({ title, description, items }: SystemInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {items.map(({ label, value, valueClassName }) => (
            <div key={label} className="flex justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className={cn('text-sm font-medium', valueClassName)}>{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
