import { useCallback, useState } from 'react'
import { showToast } from '../lib/toast'
import { captureElementAsPng, dataUrlToBlob } from '../utils/exportCapture'
import { downloadBlob } from '../utils/downloadImage'

export interface UseReceiptExportResult {
  isExporting: boolean
  exportError: string | null
  exportAsPng: (element: HTMLElement, filename: string) => Promise<void>
}

export function useReceiptExport(): UseReceiptExportResult {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportAsPng = useCallback(async (element: HTMLElement, filename: string) => {
    setIsExporting(true)
    setExportError(null)

    try {
      const dataUrl = await captureElementAsPng(element)
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
