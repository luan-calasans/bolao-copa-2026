import type { ReactNode } from 'react'
import { BackLink } from '../ui/BackLink'

interface PageHeaderProps {
  backTo?: string
  backLabel?: string
  title: string
  titleBadge?: ReactNode
  description?: string
  titleAction?: ReactNode
  children?: ReactNode
  showBack?: boolean
}

export function PageHeader({
  backTo = '/',
  backLabel = 'Voltar',
  title,
  titleBadge,
  description,
  titleAction,
  children,
  showBack = true,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {showBack && <BackLink to={backTo}>{backLabel}</BackLink>}
      <div className={`flex items-start justify-between gap-4 ${showBack ? 'mt-4' : ''}`}>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            {titleBadge}
          </div>
          {description && <p className="mt-1 text-slate-400">{description}</p>}
        </div>
        {titleAction}
      </div>
      {children}
    </div>
  )
}
