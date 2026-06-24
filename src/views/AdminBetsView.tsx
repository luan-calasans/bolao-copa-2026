import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { BetsListSection } from '../components/bet/BetsListSection'
import { AdminBetsStatsSkeleton } from '../components/bet/AllBetsStatsSkeleton'
import { BetsListSectionSkeleton } from '../components/bet/BetsListSectionSkeleton'
import { DeleteBetConfirmModal } from '../components/bet/DeleteBetConfirmModal'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { BackButton } from '../components/ui/BackLink'
import { useDeleteBetConfirmation } from '../hooks/useDeleteBetConfirmation'
import { logoutAdmin } from '../services/adminAuthService'
import { showToast } from '../lib/toast'
import { useAdminBetsViewModel } from '../viewmodels/useAdminBetsViewModel'

export function AdminBetsView() {
  const navigate = useNavigate()
  const {
    groups,
    totalBets,
    totalExact,
    totalPartial,
    totalMissed,
    isLoading,
    error,
    isEmpty,
    deletingReceiptId,
    removeBet,
    reload,
  } = useAdminBetsViewModel()

  const deleteConfirmation = useDeleteBetConfirmation(removeBet)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logoutAdmin()
      showToast('Sessão administrativa encerrada.', 'logout')
      navigate('/admin/login', { replace: true })
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível encerrar a sessão.',
        'error',
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Palpites</h1>
          <p className="mt-1.5 text-base text-slate-500">
            Visualize e exclua palpites registrados.
          </p>
        </div>
        <BackButton
          type="button"
          variant="danger"
          showIcon={false}
          className="shrink-0"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </BackButton>
      </div>

      {isLoading && <AdminBetsStatsSkeleton />}
      {!isLoading && !error && totalBets > 0 && (
        <div className="mb-6 flex gap-6 text-base text-slate-500">
          <span>
            <span className="font-medium text-slate-300">{totalBets}</span> palpites
          </span>
          <span>
            <span className="font-medium text-slate-300">{totalExact}</span> exatos
          </span>
          <span>
            <span className="font-medium text-slate-300">{totalPartial}</span> parciais
          </span>
          <span>
            <span className="font-medium text-slate-300">{totalMissed}</span> erros
          </span>
        </div>
      )}

      {isLoading && <BetsListSectionSkeleton showActions />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Nenhum palpite registrado"
          message="Os palpites feitos no bolão aparecerão aqui para administração."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <BetsListSection
          groups={groups}
          searchInputId="admin-bets-search"
          deletingReceiptId={deletingReceiptId}
          onDelete={(receiptId, participantName) =>
            deleteConfirmation.requestDelete(receiptId, participantName)
          }
        />
      )}

      <DeleteBetConfirmModal
        isOpen={deleteConfirmation.isOpen}
        participantName={deleteConfirmation.pendingParticipantName}
        isDeleting={deletingReceiptId === deleteConfirmation.pendingReceiptId}
        onConfirm={() => void deleteConfirmation.confirmDelete()}
        onCancel={deleteConfirmation.cancelDelete}
      />
    </AdminLayout>
  )
}
