import { ConfirmModal } from '../ui/ConfirmModal'

interface DeleteBetConfirmModalProps {
  isOpen: boolean
  participantName?: string
  isDeleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteBetConfirmModal({
  isOpen,
  participantName,
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteBetConfirmModalProps) {
  const description = participantName
    ? `O palpite de ${participantName} será removido permanentemente do bolão. Esta ação não pode ser desfeita.`
    : 'Este palpite será removido permanentemente do bolão. Esta ação não pode ser desfeita.'

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Excluir palpite?"
      description={description}
      confirmLabel="Excluir palpite"
      cancelLabel="Cancelar"
      isLoading={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
