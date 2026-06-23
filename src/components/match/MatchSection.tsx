import { useState } from 'react'
import type { Match } from '../../models/match'
import { useLargeDesktop } from '../../hooks/useLargeDesktop'
import type { MatchGridColumns } from '../../utils/matchGrid'
import { getMatchGridClass, shouldStackMatchCardActions } from '../../utils/matchGrid'
import {
  getStoredSectionExpanded,
  storeSectionExpanded,
  type MatchSectionVariant,
} from '../../utils/matchSectionCollapse'
import { MatchCard } from './MatchCard'

export type { MatchSectionVariant }

interface MatchSectionProps {
  title: string
  matches: Match[]
  variant?: MatchSectionVariant
  columnsPerRow?: MatchGridColumns
  collapsible?: boolean
}

export function MatchSection({
  title,
  matches,
  variant,
  columnsPerRow = 3,
  collapsible,
}: MatchSectionProps) {
  const isLargeDesktop = useLargeDesktop()
  const stackActionButtons = shouldStackMatchCardActions(columnsPerRow, isLargeDesktop)
  const canCollapse = collapsible ?? Boolean(variant)
  const [isExpanded, setIsExpanded] = useState(() =>
    variant ? getStoredSectionExpanded(variant) : true,
  )

  if (matches.length === 0) return null

  function handleToggle() {
    if (!canCollapse || !variant) return

    setIsExpanded((current) => {
      const next = !current
      storeSectionExpanded(variant, next)
      return next
    })
  }

  return (
    <section className="mb-8 min-w-0 max-w-full">
      <SectionHeader
        title={title}
        count={matches.length}
        variant={variant}
        isExpanded={isExpanded}
        canCollapse={canCollapse}
        onToggle={handleToggle}
      />

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={canCollapse ? !isExpanded : undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`grid min-w-0 gap-4 ${getMatchGridClass(columnsPerRow)} ${
              canCollapse ? 'pt-0' : ''
            }`}
          >
            {matches.map((match, index) => (
              <div key={match.id} className="min-w-0">
                <MatchCard
                  match={match}
                  prioritizeCrests={index < 2}
                  stackActionButtons={stackActionButtons}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface SectionHeaderProps {
  title: string
  count: number
  variant?: MatchSectionVariant
  isExpanded: boolean
  canCollapse: boolean
  onToggle: () => void
}

function SectionHeader({
  title,
  count,
  variant,
  isExpanded,
  canCollapse,
  onToggle,
}: SectionHeaderProps) {
  const content = (
    <>
      {variant && <SectionIndicator variant={variant} />}
      <h2 className="text-lg font-black uppercase tracking-wide text-white">{title}</h2>
      {count > 0 && (
        <span className="rounded-full bg-pitch-700 px-2.5 py-0.5 text-xs font-semibold text-brazil-yellow">
          {count}
        </span>
      )}
      {canCollapse && (
        <ChevronIcon
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      )}
    </>
  )

  if (!canCollapse) {
    return <div className="mb-4 flex items-center gap-3">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className="mb-4 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-1 py-1 text-left"
    >
      {content}
    </button>
  )
}

function SectionIndicator({ variant }: { variant: MatchSectionVariant }) {
  if (variant === 'live') {
    return (
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-brazil-green live-pulse"
        aria-hidden="true"
      />
    )
  }

  if (variant === 'upcoming') {
    return (
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brazil-yellow" aria-hidden="true" />
    )
  }

  if (variant === 'undefined') {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
  }

  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
