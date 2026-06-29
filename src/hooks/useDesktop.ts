import { useEffect, useState } from 'react'

/** Alinhado ao breakpoint `lg` do Tailwind (1024px). */
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

export function useDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)

    function handleChange() {
      setIsDesktop(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}
