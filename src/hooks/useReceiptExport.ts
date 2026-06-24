import { useCallback, useState } from 'react'
import { inlineImagesForExport, waitForImages } from '../utils/crestUrl'
import { showToast } from '../lib/toast'

export interface UseReceiptExportResult {
  isExporting: boolean
  exportError: string | null
  exportAsPng: (element: HTMLElement, filename: string) => Promise<void>
}

const EXPORT_BACKGROUND = '#070b14'
const EXPORT_PADDING = 40

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Falha ao processar imagem do comprovante.'))
    image.src = dataUrl
  })
}

async function centerImageWithPadding(sourceDataUrl: string, padding: number): Promise<string> {
  const image = await loadImage(sourceDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = image.width + padding * 2
  canvas.height = image.height + padding * 2

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas não suportado.')
  }

  context.fillStyle = EXPORT_BACKGROUND
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, padding, padding)

  return canvas.toDataURL('image/png')
}

async function captureElement(element: HTMLElement): Promise<string> {
  await waitForImages(element)
  await inlineImagesForExport(element)

  const { toPng } = await import('html-to-image')

  const width = Math.ceil(element.getBoundingClientRect().width)
  const height = Math.ceil(element.getBoundingClientRect().height)

  const rawDataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#0d1321',
    width,
    height,
    style: {
      margin: '0',
      transform: 'none',
      boxShadow: 'none',
    },
  })

  return centerImageWithPadding(rawDataUrl, EXPORT_PADDING)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mime })
}

function downloadBlob(blob: Blob, filename: string): void {
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

export function useReceiptExport(): UseReceiptExportResult {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportAsPng = useCallback(async (element: HTMLElement, filename: string) => {
    setIsExporting(true)
    setExportError(null)

    try {
      const dataUrl = await captureElement(element)
      downloadBlob(dataUrlToBlob(dataUrl), `${filename}.png`)
      showToast('Imagem salva no dispositivo.')
    } catch {
      const message = 'Não foi possível exportar a imagem. Tente novamente.'
      setExportError(message)
      showToast(message, 'error')
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    isExporting,
    exportError,
    exportAsPng,
  }
}
