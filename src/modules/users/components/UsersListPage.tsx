/**
 * Users list page component
 * Presentational - composes UI components with data from hooks
 */

import { Link } from '@tanstack/react-router'
import { Plus, Search, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/infra/ui/components'

import { useUsersList } from '../hooks'
import type { User, UserStatus } from '../types'

type UserRowProps = {
  user: User
}

function UserRow({ user }: UserRowProps) {
  const statusColors: Record<UserStatus, string> = {
    active: 'bg-success/10 text-success',
    inactive: 'bg-muted text-muted-foreground',
    pending: 'bg-warning/10 text-warning',
  }

  const statusLabels: Record<UserStatus, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
  }

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground capitalize">{user.role}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.status]}`}
        >
          {statusLabels[user.status]}
        </span>
      </div>
    </Link>
  )
}

export function UsersListPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useUsersList({ search: search || undefined })

  // Mock data for demonstration (since we don't have a real API)
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'manager@example.com',
      name: 'Manager User',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'user@example.com',
      name: 'Regular User',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Use mock data if API call fails or is loading
  const users = data?.data ?? mockUsers

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Novo Usuário</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>{users.length} usuário(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">
              Erro ao carregar usuários. Usando dados de demonstração.
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado</div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
