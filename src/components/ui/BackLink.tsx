import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const backControlBaseClass =
  'group inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold shadow-sm shadow-black/15 transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50'

const backControlVariants = {
  default:
    'border-slate-600/40 bg-pitch-800/50 text-slate-300 hover:border-brazil-yellow/35 hover:bg-pitch-700/70 hover:text-white focus-visible:ring-brazil-yellow/40',
  danger:
    'border-red-500/40 bg-red-500/10 text-red-300 hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-200 focus-visible:ring-red-500/40',
} as const

type BackControlVariant = keyof typeof backControlVariants

interface BackLinkProps {
  to: string
  children: ReactNode
  className?: string
}

export function BackLink({ to, children, className = '' }: BackLinkProps) {
  return (
    <Link to={to} className={`${backControlBaseClass} ${backControlVariants.default} ${className}`}>
      <ChevronLeftIcon className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:-translate-x-0.5 group-hover:text-brazil-yellow" />
      <span>{children}</span>
    </Link>
  )
}

interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  showIcon?: boolean
  variant?: BackControlVariant
}

export function BackButton({
  children,
  className = '',
  showIcon = true,
  variant = 'default',
  type = 'button',
  ...props
}: BackButtonProps) {
  return (
    <button
      type={type}
      className={`${backControlBaseClass} ${backControlVariants[variant]} ${className}`}
      {...props}
    >
      {showIcon && (
        <ChevronLeftIcon className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:-translate-x-0.5 group-hover:text-brazil-yellow" />
      )}
      <span>{children}</span>
    </button>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
