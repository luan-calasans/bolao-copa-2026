export type MatchSectionVariant = 'live' | 'upcoming' | 'finished' | 'undefined'

type ExpandedSections = Partial<Record<MatchSectionVariant, boolean>>

const expandedSections: ExpandedSections = {}

export function getStoredSectionExpanded(variant: MatchSectionVariant): boolean {
  return expandedSections[variant] ?? true
}

export function storeSectionExpanded(variant: MatchSectionVariant, expanded: boolean): void {
  expandedSections[variant] = expanded
}
