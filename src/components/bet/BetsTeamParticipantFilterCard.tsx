import type { ParticipantFilterOption } from '../../utils/betListFilters'
import type { CountryFilterOption } from '../../utils/matchFilters'
import { SidebarFilterSection } from '../match/SidebarFilter'

const selectClass =
  'w-full cursor-pointer rounded-lg border border-slate-600/50 bg-pitch-900/80 px-3.5 py-2.5 text-base text-slate-200 outline-none transition focus:border-brazil-yellow/60 focus:ring-1 focus:ring-brazil-yellow/30'

interface BetsTeamParticipantFilterCardProps {
  countryFilterOptions: CountryFilterOption[]
  selectedCountryId: number | null
  onCountryChange: (countryId: number | null) => void
  participantFilterOptions: ParticipantFilterOption[]
  selectedParticipantKey: string | null
  onParticipantChange: (personNameKey: string | null) => void
}

export function BetsTeamParticipantFilterCard({
  countryFilterOptions,
  selectedCountryId,
  onCountryChange,
  participantFilterOptions,
  selectedParticipantKey,
  onParticipantChange,
}: BetsTeamParticipantFilterCardProps) {
  const hasCountryFilter = countryFilterOptions.length > 0
  const hasParticipantFilter = participantFilterOptions.length > 0

  if (!hasCountryFilter && !hasParticipantFilter) {
    return null
  }

  const title = hasCountryFilter ? 'Seleção' : 'Participantes'

  return (
    <SidebarFilterSection title={title} variant="card">
      {hasCountryFilter && (
        <select
          id="country-filter"
          value={selectedCountryId ?? ''}
          onChange={(event) => {
            const value = event.target.value
            onCountryChange(value ? Number(value) : null)
          }}
          className={selectClass}
          aria-label="Seleção"
        >
          <option value="">Todas</option>
          {countryFilterOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {hasParticipantFilter && (
        <>
          {hasCountryFilter && (
            <h3 className="mb-2 mt-3 px-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Participantes
            </h3>
          )}
          <select
            id="participant-filter"
            value={selectedParticipantKey ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onParticipantChange(value || null)
            }}
            className={selectClass}
            aria-label="Participantes"
          >
            <option value="">Todos</option>
            {participantFilterOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}
    </SidebarFilterSection>
  )
}
