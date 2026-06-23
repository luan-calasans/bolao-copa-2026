import { useCallback, useState } from 'react'

interface PendingDelete {
  receiptId: string
  participantName?: string
}

export function useDeleteBetConfirmation(onDelete: (receiptId: string) => Promise<void>) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const requestDelete = useCallback((receiptId: string, participantName?: string) => {
    setPendingDelete({ receiptId, participantName })
  }, [])

  const cancelDelete = useCallback(() => {
    setPendingDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return

    try {
      await onDelete(pendingDelete.receiptId)
      setPendingDelete(null)
    } catch {
      // Mantém o modal aberto para o usuário tentar novamente ou cancelar.
    }
  }, [onDelete, pendingDelete])

  return {
    isOpen: pendingDelete !== null,
    pendingReceiptId: pendingDelete?.receiptId ?? null,
    pendingParticipantName: pendingDelete?.participantName,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
