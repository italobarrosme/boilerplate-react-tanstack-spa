/**
 * Página de callback OAuth.
 * Trata o retorno OIDC após a autenticação.
 */

import { useNavigate } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useAuthCallback } from '@/infra/auth'
import { pkceStorage } from '@/infra/auth/pkce'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingScreen,
} from '@/infra/ui/components'

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const { handleCallback } = useAuthCallback()
  const navigate = useNavigate()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const processCallback = async () => {
      try {
        await handleCallback(window.location.href)

        // Get the original return URL
        const returnTo = pkceStorage.getReturnTo() ?? '/'
        pkceStorage.clearReturnTo()

        // Redirect to the original page
        // Using window.location to force a full page reload to reinitialize auth state
        window.location.href = returnTo
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    processCallback()
  }, [handleCallback])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Erro na autenticação</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/auth/login' })}
              variant="outline"
              className="w-full"
            >
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <LoadingScreen message="Processando autenticação..." />
}
