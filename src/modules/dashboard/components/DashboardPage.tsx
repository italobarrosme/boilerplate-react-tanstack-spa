/**
 * Dashboard page component
 * Presentational - receives all data via hooks
 */

import { BarChart3, Users } from 'lucide-react'

import { useAuth } from '@/infra/auth'

import { SystemInfoCard } from '@/modules/common/components'
import { StatCard } from './StatCard'

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

      <SystemInfoCard
        title="Informações do Sistema"
        description="Status atual"
        items={[
          { label: 'Versão', value: '1.0.0' },
          { label: 'Ambiente', value: import.meta.env.MODE },
          { label: 'Status', value: 'Online', valueClassName: 'text-success' },
        ]}
      />
    </div>
  )
}
