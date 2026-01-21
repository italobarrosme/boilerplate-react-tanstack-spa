/**
 * Login page component
 * Presentational - receives all data via hooks
 */

import { useNavigate, useSearch } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { useEffect } from 'react'

import { useAuth } from '@/infra/auth'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/infra/ui/components'

export function LoginPage() {
  const { isAuthenticated, isLoading, login, error } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/login' })

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = search.redirect ?? '/'
      navigate({ to: redirectTo })
    }
  }, [isAuthenticated, navigate, search.redirect])

  const handleLogin = async () => {
    await login(search.redirect ?? '/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo</CardTitle>
          <CardDescription>Faça login para acessar o Backoffice</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}

          <Button
            onClick={handleLogin}
            isLoading={isLoading}
            leftIcon={<LogIn className="h-4 w-4" />}
            className="w-full"
          >
            Entrar com SSO
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Ao continuar, você será redirecionado para o provedor de autenticação.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
