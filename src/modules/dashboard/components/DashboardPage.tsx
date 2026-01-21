/**
 * Dashboard page component
 * Presentational - receives all data via hooks
 */

import { BarChart3, TrendingUp, Users } from 'lucide-react'

import { useAuth } from '@/infra/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/infra/ui/components'

type StatCardProps = {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
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
            className={`mt-2 flex items-center gap-1 text-xs ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}
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

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.firstName ?? user?.name ?? 'Usuário'}!
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total de Usuários"
          value="1,234"
          description="Usuários ativos no sistema"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Novos Usuários"
          value="89"
          description="Cadastrados este mês"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Atividade"
          value="456"
          description="Ações realizadas hoje"
          icon={BarChart3}
        />
      </div>

      {/* Content area */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Usuário realizou uma ação</p>
                    <p className="text-xs text-muted-foreground">Há {i * 10} minutos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Versão</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ambiente</span>
                <span className="text-sm font-medium">{import.meta.env.MODE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-success">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
