export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function toFullImageUrl(url: string): string {
  return url.replace(/\/(medium|small|tiny)$/, '')
}

function getImageExtension(url: string): string {
  const path = toFullImageUrl(url.split('?')[0] ?? url)
  const extension = path.split('.').pop()?.toLowerCase()

  if (!extension || extension.length > 5 || !/^[a-z0-9]+$/.test(extension)) {
    return 'jpg'
  }

  return extension
}

export function buildHighlightImageFilename(label: string, url: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'imagem'}.${getImageExtension(url)}`
}

export async function downloadImageFromUrl(url: string, filename: string): Promise<void> {
  const fullUrl = toFullImageUrl(url)

  try {
    const response = await fetch(fullUrl)
    if (!response.ok) {
      throw new Error('Falha ao baixar imagem.')
    }

    const blob = await response.blob()
    downloadBlob(blob, filename)
    return
  } catch {
    const link = document.createElement('a')
    link.href = fullUrl
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
