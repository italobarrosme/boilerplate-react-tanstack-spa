import { TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/infra/ui/components'

export type StatCardProps = {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div
            className={`mt-2 flex items-center gap-1 text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}
          >
            <TrendingUp className={`h-3 w-3 ${!trend.isPositive && 'rotate-180'}`} />
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value}% em relação ao mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
