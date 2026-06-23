import { useState } from 'react'
import { normalizeCrestUrl } from '../../utils/crestUrl'
import { hasValidCrest } from '../../utils/teamDisplay'

type TeamCrestSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<TeamCrestSize, string> = {
  sm: 'h-10 w-10 sm:h-12 sm:w-12',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
}

const crestDimensions: Record<TeamCrestSize, { width: number; height: number }> = {
  sm: { width: 48, height: 48 },
  md: { width: 48, height: 48 },
  lg: { width: 56, height: 56 },
}

type ImageLoading = 'lazy' | 'eager'
type ImageFetchPriority = 'high' | 'low' | 'auto'

interface TeamCrestProps {
  crest?: string | null
  name: string
  shortName?: string
  tla?: string
  size?: TeamCrestSize
  className?: string
  isDefined?: boolean
  loading?: ImageLoading
  fetchPriority?: ImageFetchPriority
}

export function TeamCrest({
  crest,
  name,
  size = 'md',
  className = '',
  isDefined = true,
  loading = 'lazy',
  fetchPriority = 'auto',
}: TeamCrestProps) {
  const normalizedCrest = normalizeCrestUrl(crest)
  const [hasError, setHasError] = useState(false)
  const showPlaceholder = !isDefined || !hasValidCrest(normalizedCrest) || hasError
  const sizeClass = sizeClasses[size]
  const { width, height } = crestDimensions[size]

  if (showPlaceholder) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-xl border border-dashed border-slate-600/60 bg-pitch-900/40 ${className}`}
        title={name}
        aria-label={`Escudo de ${name} indisponível`}
      />
    )
  }

  return (
    <img
      src={normalizedCrest}
      alt={`Escudo ${name}`}
      width={width}
      height={height}
      className={`${sizeClass} shrink-0 object-contain ${className}`}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setHasError(true)}
    />
  )
}
