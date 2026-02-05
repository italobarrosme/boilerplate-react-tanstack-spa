import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const keycloakUrl = env.VITE_KEYCLOAK_URL ?? 'https://ssohml.vibraenergia.com.br/auth'
  const keycloakOrigin = new URL(keycloakUrl).origin

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: './src/app/routes',
        generatedRouteTree: './src/app/routeTree.gen.ts',
        routeFileIgnorePrefix: '-',
        quoteStyle: 'single',
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Proxy para evitar CORS ao fazer requests para o Keycloak
        '/auth-proxy': {
          target: keycloakOrigin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth-proxy/, new URL(keycloakUrl).pathname),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
