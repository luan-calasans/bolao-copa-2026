import { useEffect, useState } from 'react'
import { LuWifiOff } from 'react-icons/lu'

export function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[var(--app-header-height)] z-[90] flex justify-center px-4"
    >
      <div className="offline-banner flex max-w-md items-center gap-2 rounded-b-xl border border-amber-500/30 border-t-0 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg shadow-black/20 backdrop-blur-md">
        <LuWifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Sem conexão. Alguns dados podem estar desatualizados.</span>
      </div>
    </div>
  )
}
