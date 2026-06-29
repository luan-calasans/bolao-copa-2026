import { inlineImagesForExport, waitForImages } from './crestUrl'

const DEFAULT_EXPORT_BACKGROUND = '#070b14'
const DEFAULT_CAPTURE_BACKGROUND = '#0d1321'

export interface CaptureElementOptions {
  backgroundColor?: string
  padding?: number
  pixelRatio?: number
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Falha ao processar imagem para exportação.'))
    image.src = dataUrl
  })
}

async function centerImageWithPadding(
  sourceDataUrl: string,
  padding: number,
  backgroundColor: string,
): Promise<string> {
  const image = await loadImage(sourceDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = image.width + padding * 2
  canvas.height = image.height + padding * 2

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas não suportado.')
  }

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, padding, padding)

  return canvas.toDataURL('image/png')
}

export async function captureElementAsPng(
  element: HTMLElement,
  options: CaptureElementOptions = {},
): Promise<string> {
  const {
    backgroundColor = DEFAULT_CAPTURE_BACKGROUND,
    padding = 40,
    pixelRatio = 2,
  } = options

  await waitForImages(element)
  await inlineImagesForExport(element)

  const { toPng } = await import('html-to-image')

  const width = Math.ceil(element.getBoundingClientRect().width)
  const height = Math.ceil(element.getBoundingClientRect().height)

  const rawDataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio,
    backgroundColor,
    width,
    height,
    style: {
      margin: '0',
      transform: 'none',
      boxShadow: 'none',
    },
  })

  return centerImageWithPadding(rawDataUrl, padding, DEFAULT_EXPORT_BACKGROUND)
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mime })
}
