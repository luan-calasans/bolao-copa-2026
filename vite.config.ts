import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
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
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'favicon.png',
          'logo.png',
          'ball-button.png',
          'world-cup-lottie.json',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/apple-touch-icon.png',
          'icons/icon-maskable-512.png',
        ],
        manifest: {
          name: 'Bolão Copa do Mundo FIFA 2026',
          short_name: 'Bolão 2026',
          description:
            'Bolão Copa do Mundo FIFA 2026 — palpites, comprovantes e acompanhamento dos jogos.',
          theme_color: '#070b14',
          background_color: '#070b14',
          display: 'standalone',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Ranking',
              short_name: 'Ranking',
              url: '/ranking',
              icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Meus palpites',
              short_name: 'Meus palpites',
              url: '/meus-palpites',
              icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Palpites',
              short_name: 'Palpites',
              url: '/palpites',
              icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^\/api\/crests\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'team-crests',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^\/api\/football\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'football-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
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
