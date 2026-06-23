import { useEffect, useState } from 'react'

export const LARGE_DESKTOP_MEDIA_QUERY = '(min-width: 1280px)'

export function useLargeDesktop(): boolean {
  const [isLargeDesktop, setIsLargeDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LARGE_DESKTOP_MEDIA_QUERY).matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(LARGE_DESKTOP_MEDIA_QUERY)

    function handleChange() {
      setIsLargeDesktop(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isLargeDesktop
}
