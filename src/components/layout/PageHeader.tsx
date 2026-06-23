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
  centered?: boolean
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
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? 'text-center' : ''}`}>
      {showBack && (
        <div className={centered ? 'flex justify-center' : undefined}>
          <BackLink to={backTo}>{backLabel}</BackLink>
        </div>
      )}
      <div
        className={`flex items-start gap-4 ${showBack ? 'mt-4' : ''} ${
          centered ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className={`min-w-0 ${centered ? 'flex flex-col items-center' : ''}`}>
          <div
            className={`flex min-w-0 flex-wrap items-center gap-2.5 ${
              centered ? 'justify-center' : ''
            }`}
          >
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
