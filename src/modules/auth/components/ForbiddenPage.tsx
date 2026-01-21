/**
 * Forbidden (403) page
 * Shown when user doesn't have permission to access a resource
 */

import { Link } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/infra/ui/components'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <ShieldX className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página. Entre em contato com o administrador se
            acredita que isso é um erro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className="block">
            <Button variant="outline" className="w-full">
              Voltar para o início
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
