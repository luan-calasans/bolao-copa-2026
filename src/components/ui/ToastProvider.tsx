import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LuCircleAlert, LuCircleCheck, LuInfo, LuLogOut } from 'react-icons/lu'
import {
  registerShowToast,
  TOAST_DURATION_MS,
  type ToastItem,
  type ToastVariant,
} from '../../lib/toast'

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-brazil-green/40 bg-pitch-900/95 text-emerald-100',
  info: 'border-slate-600/50 bg-pitch-900/95 text-slate-100',
  error: 'border-red-500/40 bg-pitch-900/95 text-red-100',
  logout: 'border-red-500/50 bg-red-500/15 text-red-100',
}

const variantIcons: Record<ToastVariant, typeof LuCircleCheck> = {
  success: LuCircleCheck,
  info: LuInfo,
  error: LuCircleAlert,
  logout: LuLogOut,
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const Icon = variantIcons[toast.variant]

  return (
    <div
      role="status"
      className={`toast-card toast-card--${toast.variant} flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-md ${variantStyles[toast.variant]}`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  )
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextIdRef = useRef(0)
  const timeoutIdsRef = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id)
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      timeoutIdsRef.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success', durationMs = TOAST_DURATION_MS) => {
      const id = String(++nextIdRef.current)
      const toast: ToastItem = { id, message, variant }

      setToasts((current) => [...current, toast])

      const timeoutId = window.setTimeout(() => dismissToast(id), durationMs)
      timeoutIdsRef.current.set(id, timeoutId)
    },
    [dismissToast],
  )

  useEffect(() => {
    registerShowToast(showToast)
    return () => registerShowToast(null)
  }, [showToast])

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current
    return () => {
      for (const timeoutId of timeoutIds.values()) {
        window.clearTimeout(timeoutId)
      }
      timeoutIds.clear()
    }
  }, [])

  return (
    <>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-8"
        >
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} />
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
