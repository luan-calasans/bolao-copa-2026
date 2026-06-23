interface DashedPlaceholderProps {
  className?: string
  label: string
}

export function DashedPlaceholder({ className = '', label }: DashedPlaceholderProps) {
  return (
    <span
      className={`inline-block rounded border border-dashed border-slate-600/60 bg-pitch-900/40 ${className}`}
      aria-label={label}
    />
  )
}
