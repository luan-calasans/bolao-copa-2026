import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useLocation } from 'react-router-dom'
import { toLoadError, type LoadError } from '../utils/errorMessages'

const MIN_HIDDEN_BEFORE_REFETCH_MS = 5_000

export interface UseAsyncResourceResult<T> {
  data: T | null
  setData: Dispatch<SetStateAction<T | null>>
  isLoading: boolean
  error: LoadError | null
  reload: (force?: boolean) => void
}

export function useAsyncResource<T>(
  loadFn: (forceRefresh?: boolean) => Promise<T>,
  deps: ReadonlyArray<unknown>,
): UseAsyncResourceResult<T> {
  const location = useLocation()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<LoadError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const isMountedRef = useRef(true)
  const isInitialLoadRef = useRef(true)
  const hiddenAtRef = useRef<number | null>(null)
  const loadIntentRef = useRef<{ showLoading: boolean; force: boolean }>({
    showLoading: true,
    force: false,
  })

  const reload = useCallback((force = false) => {
    loadIntentRef.current = { showLoading: true, force }
    setReloadKey((key) => key + 1)
  }, [])

  const runLoad = useCallback(
    async (options: { showLoading: boolean; force: boolean }) => {
      if (options.showLoading) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const result = await loadFn(options.force)

        if (!isMountedRef.current) return

        setData(result)
        setError(null)
      } catch (err) {
        if (!isMountedRef.current) return

        setError(toLoadError(err))
        if (options.showLoading) {
          setData(null)
        }
      } finally {
        if (isMountedRef.current && options.showLoading) {
          setIsLoading(false)
          isInitialLoadRef.current = false
        }
      }
    },
    [loadFn],
  )

  useEffect(() => {
    isMountedRef.current = true

    const intent = loadIntentRef.current
    loadIntentRef.current = { showLoading: false, force: false }

    const showLoading = isInitialLoadRef.current || intent.showLoading

    void runLoad({ showLoading, force: intent.force })

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadKey triggers refetch; deps are caller-provided
  }, [location.key, ...deps, reloadKey, runLoad])

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      void runLoad({ showLoading: false, force: false })
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        return
      }

      if (document.visibilityState !== 'visible') return

      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0
      hiddenAtRef.current = null

      if (hiddenFor >= MIN_HIDDEN_BEFORE_REFETCH_MS) {
        void runLoad({ showLoading: false, force: false })
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [runLoad])

  return { data, setData, isLoading, error, reload }
}
