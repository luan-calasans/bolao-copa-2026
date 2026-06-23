import { Button } from '../ui/Button'

interface ExportButtonsProps {
  onExportPng: () => void
  isExporting: boolean
  exportError: string | null
}

export function ExportButtons({ onExportPng, isExporting, exportError }: ExportButtonsProps) {
  return (
    <div className="mt-8 text-center">
      <p className="mb-4 text-sm text-slate-400">Exportar comprovante</p>
      <Button variant="gold" onClick={onExportPng} disabled={isExporting}>
        {isExporting ? 'Exportando...' : 'Baixar PNG'}
      </Button>
      {exportError && <p className="mt-3 text-sm text-red-400">{exportError}</p>}
    </div>
  )
}
