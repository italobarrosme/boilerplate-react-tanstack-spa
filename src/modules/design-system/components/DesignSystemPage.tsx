/**
 * Design System showcase: tokens and UI components
 * Presentational page for documentation/reference
 */

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/infra/ui/components'

const colorTokens = [
  { name: 'brand', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] },
  { name: 'gold', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
] as const

const semanticColors = [
  'background',
  'foreground',
  'muted',
  'muted-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'success',
  'warning',
  'card',
  'card-foreground',
  'border',
  'input',
  'ring',
] as const

const radiusTokens = ['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const

export function DesignSystemPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Design System</h1>
        <p className="mt-1 text-muted-foreground">
          Tokens e componentes do projeto para referência e consistência.
        </p>
      </header>

      {/* Tokens: Colors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Tokens — Cores</h2>

        {colorTokens.map(({ name, scale }) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="capitalize">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scale.map((step) => (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1"
                    title={`--color-${name}-${step}`}
                  >
                    <div
                      className="h-12 w-12 rounded-lg border border-border shadow-sm"
                      style={{
                        backgroundColor: `var(--color-${name}-${step})`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Semânticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {semanticColors.map((token) => (
                <div key={token} className="flex flex-col gap-1">
                  <div
                    className="h-10 w-full rounded-md border border-border"
                    style={{ backgroundColor: `var(--color-${token})` }}
                  />
                  <span className="text-xs text-muted-foreground">{token}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tokens: Radius */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Tokens — Border Radius</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
              {radiusTokens.map((r) => (
                <div key={r} className="flex flex-col items-center gap-2">
                  <div
                    className="h-16 w-16 bg-primary"
                    style={{ borderRadius: `var(--radius-${r})` }}
                  />
                  <span className="text-sm text-muted-foreground">--radius-{r}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tokens: Shadows */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Tokens — Sombras</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['sm', 'md', 'lg'] as const).map((shadow) => (
            <Card key={shadow} className="p-6" style={{ boxShadow: `var(--shadow-${shadow})` }}>
              <p className="text-sm font-medium text-foreground">--shadow-{shadow}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Components: Button */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Componentes — Button</h2>
        <Card>
          <CardHeader>
            <CardTitle>Variantes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tamanhos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🔗</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
          </CardContent>
        </Card>
      </section>

      {/* Components: Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Componentes — Card</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card com título</CardTitle>
              <p className="text-sm text-muted-foreground">CardDescription aqui.</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">CardContent — corpo do card.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outro exemplo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Estrutura: Card, CardHeader, CardTitle, CardContent (e opcional CardFooter).</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Components: Input */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Componentes — Input</h2>
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-md">
            <Input label="Label" placeholder="Placeholder" />
            <Input placeholder="Sem label" />
            <Input label="Com erro" error="Mensagem de erro" placeholder="Campo inválido" />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
