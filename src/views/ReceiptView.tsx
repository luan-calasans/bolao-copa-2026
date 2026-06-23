import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ExportButtons } from '../components/receipt/ExportButtons'
import { ChampionReceiptTicket } from '../components/receipt/ChampionReceiptTicket'
import { ReceiptTicket } from '../components/receipt/ReceiptTicket'
import { Button } from '../components/ui/Button'
import { ReceiptTicketSkeleton } from '../components/receipt/ReceiptTicketSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useReceiptExport } from '../hooks/useReceiptExport'
import { useReceiptViewModel } from '../viewmodels/useReceiptViewModel'
import { APP_ROUTES } from '../routes/routePaths'
import { canPlaceBet } from '../utils/matchStatus'

interface ReceiptViewProps {
  receiptId: string
}

export function ReceiptView({ receiptId }: ReceiptViewProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { storedReceipt, isLoading, notFound, error } = useReceiptViewModel(receiptId)
  const { isExporting, exportError, exportAsPng } = useReceiptExport()

  const receiptIdForExport =
    storedReceipt?.kind === 'match'
      ? storedReceipt.receipt.id
      : storedReceipt?.kind === 'champion'
        ? storedReceipt.receipt.id
        : null

  const handleExportPng = () => {
    if (ticketRef.current && receiptIdForExport) {
      void exportAsPng(ticketRef.current, `bolao-${receiptIdForExport}`)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Comprovante do palpite</h1>
        <p className="mt-1 text-slate-400">Seu bolão foi registrado com sucesso!</p>
      </div>

      {isLoading && (
        <>
          <ReceiptTicketSkeleton />
          <div className="mt-8 text-center">
            <Skeleton className="mx-auto mb-4 h-4 w-40" />
            <Skeleton className="mx-auto h-10 w-36 rounded-xl" />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </>
      )}
      {error && <ErrorState message={error.message} statusCode={error.statusCode} />}
      {notFound && !error && (
        <EmptyState
          title="Comprovante não encontrado"
          message="Este comprovante não existe ou ainda não foi registrado no banco."
        />
      )}

      {storedReceipt?.kind === 'match' && (
        <>
          <ReceiptTicket ref={ticketRef} receipt={storedReceipt.receipt} />

          <ExportButtons
            onExportPng={handleExportPng}
            isExporting={isExporting}
            exportError={exportError}
          />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={APP_ROUTES.home}>
              <Button variant="secondary">Ver mais jogos</Button>
            </Link>
            <Link to={`/jogo/${storedReceipt.receipt.bet.matchId}/palpites`}>
              <Button variant="ghost">Palpites do jogo</Button>
            </Link>
            {storedReceipt.receipt.bet.match && canPlaceBet(storedReceipt.receipt.bet.match) && (
              <Link to={`/palpite/${storedReceipt.receipt.bet.matchId}`}>
                <Button variant="ghost">Novo palpite neste jogo</Button>
              </Link>
            )}
          </div>
        </>
      )}

      {storedReceipt?.kind === 'champion' && (
        <>
          <ChampionReceiptTicket ref={ticketRef} receipt={storedReceipt.receipt} />

          <ExportButtons
            onExportPng={handleExportPng}
            isExporting={isExporting}
            exportError={exportError}
          />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={APP_ROUTES.home}>
              <Button variant="secondary">Ver jogos</Button>
            </Link>
            <Link to={APP_ROUTES.championBet}>
              <Button variant="ghost">Palpite de campeão</Button>
            </Link>
          </div>
        </>
      )}
    </AppLayout>
  )
}
