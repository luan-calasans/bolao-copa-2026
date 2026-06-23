import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-pitch-600 hover:bg-pitch-700 text-white border border-slate-600/40',
  secondary: 'bg-pitch-700 hover:bg-pitch-800 text-slate-100 border border-slate-600/40',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300',
  gold: 'gradient-gold text-pitch-950 font-bold hover:brightness-110 shadow-md shadow-brazil-yellow/20',
  danger: 'bg-transparent text-red-400 border border-red-500/40 hover:bg-red-500/10',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
