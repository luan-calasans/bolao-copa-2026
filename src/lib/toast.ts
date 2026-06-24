export type ToastVariant = 'success' | 'info' | 'error' | 'logout'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

export const TOAST_DURATION_MS = 3000

type ShowToastHandler = (message: string, variant?: ToastVariant, durationMs?: number) => void

let showToastHandler: ShowToastHandler | null = null

export function registerShowToast(handler: ShowToastHandler | null) {
  showToastHandler = handler
}

export function showToast(
  message: string,
  variant: ToastVariant = 'success',
  durationMs = TOAST_DURATION_MS,
) {
  showToastHandler?.(message, variant, durationMs)
}
