import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AppRoutes } from './routes/AppRoutes'
import { ThemeProvider } from './theme/ThemeProvider'
import { ParticipantProvider } from './contexts/ParticipantProvider'
import { ToastProvider } from './components/ui/ToastProvider'

const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((module) => ({ default: module.SpeedInsights })),
)

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((module) => ({ default: module.Analytics })),
)

function DeferredVercelMonitoring() {
  const { pathname } = useLocation()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(() => setEnabled(true), { timeout: 3000 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = window.setTimeout(() => setEnabled(true), 2000)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!enabled) return null

  return (
    <Suspense fallback={null}>
      <Analytics />
      <SpeedInsights route={pathname} />
    </Suspense>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ParticipantProvider>
          <ToastProvider>
            <DeferredVercelMonitoring />
            <ScrollToTop />
            <AppRoutes />
          </ToastProvider>
        </ParticipantProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
