const CRESTS_HOST = 'crests.football-data.org'

export function normalizeCrestUrl(crest: string | null | undefined): string {
  const trimmed = crest?.trim() ?? ''
  if (!trimmed) return ''

  if (trimmed.startsWith('/api/crests/')) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    if (url.hostname === CRESTS_HOST) {
      return `/api/crests${url.pathname}`
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function inlineImagesForExport(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'))

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:')) return

      const dataUrl = await imageUrlToDataUrl(src)
      if (dataUrl) {
        img.src = dataUrl
      }
    }),
  )
}

export async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'))

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve()
            return
          }

          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        }),
    ),
  )
}
