/**
 * Componente da página de detalhe do usuário.
 * Apresentacional — compõe componentes de UI com dados dos hooks.
 */

import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Mail, Shield, User as UserIcon } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/infra/ui/components'

import { useUser } from '../hooks'
import type { User, UserStatus } from '../types'

export function UserDetailPage() {
  const { userId } = useParams({ from: '/_authenticated/users/$userId' })
  const { data: user, isLoading } = useUser(userId)

  // Mock user for demonstration
  const mockUser: User = {
    id: userId,
    email: 'user@example.com',
    name: 'Example User',
    firstName: 'Example',
    lastName: 'User',
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const displayUser = user ?? mockUser

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <Link to="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{displayUser.name}</h1>
            <p className="text-muted-foreground">{displayUser.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[displayUser.status]}`}
          >
            {statusLabels[displayUser.status]}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{displayUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nome Completo</p>
              <p className="font-medium">
                {displayUser.firstName && displayUser.lastName
                  ? `${displayUser.firstName} ${displayUser.lastName}`
                  : displayUser.name}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Função</p>
              <p className="font-medium capitalize">{displayUser.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{statusLabels[displayUser.status]}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadados</CardTitle>
          <CardDescription>Informações do registro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{displayUser.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="text-sm">{new Date(displayUser.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atualizado em</p>
              <p className="text-sm">{new Date(displayUser.updatedAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline">Editar Usuário</Button>
        <Button variant="destructive">Desativar Usuário</Button>
      </div>
    </div>
  )
}
