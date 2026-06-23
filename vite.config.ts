import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ProxyOptions } from 'vite'

function createCrestsProxy(): ProxyOptions {
  return {
    target: 'https://crests.football-data.org',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/crests/, ''),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const crestsProxy = createCrestsProxy()
  const isProduction = mode === 'production'
  const bolaoAccessToken = (env.BOLAO_ACCESS_TOKEN || env.VITE_BOLAO_ACCESS_TOKEN || '').trim()

  return {
    base: '/',
    define: {
      'import.meta.env.VITE_BOLAO_ACCESS_TOKEN': JSON.stringify(bolaoAccessToken),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'bets-api-dev',
        configureServer(server) {
          if (isProduction) return

          for (const [key, value] of Object.entries(env)) {
            if (value) {
              process.env[key] = value
            }
          }

          server.middlewares.use((req, res, next) => {
            const url = req.url ?? ''

            if (url.startsWith('/api/football')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/footballProxyHttp.js')
                .then(({ handleFootballProxyRequest }) => handleFootballProxyRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/sportsdb')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/sportsdbProxyHttp.js')
                .then(({ handleSportsdbProxyRequest }) => handleSportsdbProxyRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/bets')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/betsHttp.js')
                .then(({ handleBetsRequest }) => handleBetsRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/admin/')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/adminRouter.js')
                .then(({ handleAdminRouterRequest }) => handleAdminRouterRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/participant/')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/participantRouter.js')
                .then(({ handleParticipantRouterRequest }) =>
                  handleParticipantRouterRequest(req, res),
                )
                .catch(next)
              return
            }

            if (url.startsWith('/api/ranking')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/rankingHttp.js')
                .then(({ handleRankingRequest }) => handleRankingRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/champion-bets')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/championBetsHttp.js')
                .then(({ handleChampionBetsRequest }) => handleChampionBetsRequest(req, res))
                .catch(next)
              return
            }

            if (url.startsWith('/api/ai-predict')) {
              // @ts-expect-error módulo JS sem declaração de tipos
              import('./server/lib/aiPredictHttp.js')
                .then(({ handleAiPredictRequest }) => handleAiPredictRequest(req, res))
                .catch(next)
              return
            }

            next()
          })
        },
      },
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/jsx-runtime') ||
              id.includes('node_modules/react/index')
            ) {
              return 'vendor-react'
            }

            if (id.includes('node_modules/react-router')) {
              return 'vendor-router'
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/crests': crestsProxy,
      },
    },
    preview: {
      proxy: {
        '/api/crests': crestsProxy,
      },
    },
  }
})
