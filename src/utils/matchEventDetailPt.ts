const EXACT_EVENT_LABELS: Record<string, string> = {
  'normal goal': 'Gol',
  goal: 'Gol',
  penalty: 'Pênalti',
  'own goal': 'Gol contra',
  'yellow card': 'Cartão amarelo',
  'red card': 'Cartão vermelho',
  'card upgrade': 'Mudança de cartão',
  'card updated': 'Mudança de cartão',
  'second yellow card': '2º cartão amarelo',
  'second yellow': '2º cartão amarelo',
  'goal disallowed': 'Gol anulado',
  'goal cancelled': 'Gol anulado',
  'goal canceled': 'Gol anulado',
  'missed penalty': 'Pênalti perdido',
  'penalty missed': 'Pênalti perdido',
  substitution: 'Substituição',
  subst: 'Substituição',
  'substitution in': 'Entra',
  'substitution out': 'Sai',
  injury: 'Lesão',
  'match ended': 'Fim de jogo',
  'match started': 'Início do jogo',
  'half time': 'Intervalo',
  'full time': 'Fim de jogo',
  'extra time': 'Prorrogação',
  'penalty shootout': 'Disputa de pênaltis',
}

const VAR_REASON_LABELS: Record<string, string> = {
  offside: 'impedimento',
  foul: 'falta',
  handball: 'mão',
  'hand ball': 'mão',
  'outside the box': 'fora da área',
  'inside the box': 'dentro da área',
  'not offside': 'não havia impedimento',
  'goal confirmed': 'gol confirmado',
  'no goal': 'sem gol',
  encroachment: 'invasão da área',
  'double touch': 'toque duplo',
}

function translateVarReason(reason: string): string {
  const normalized = reason.trim().toLowerCase()

  if (!normalized) {
    return ''
  }

  if (VAR_REASON_LABELS[normalized]) {
    return VAR_REASON_LABELS[normalized]
  }

  for (const [pattern, label] of Object.entries(VAR_REASON_LABELS)) {
    if (normalized.includes(pattern)) {
      return label
    }
  }

  return reason.trim()
}

export function translateMatchEventDetail(detail: string): string {
  const normalized = detail.trim()

  if (!normalized) {
    return 'Evento'
  }

  const lower = normalized.toLowerCase()
  const exact = EXACT_EVENT_LABELS[lower]

  if (exact) {
    return exact
  }

  if (/^substitution\s*\d+$/i.test(normalized) || /^subst\s*\d+$/i.test(normalized)) {
    return 'Substituição'
  }

  if (/goal disallowed/i.test(normalized)) {
    return 'Gol anulado'
  }

  if (/^var\s*-?\s*/i.test(normalized)) {
    const reason = normalized.replace(/^var\s*-?\s*/i, '').trim()
    return reason ? `VAR (${translateVarReason(reason)})` : 'VAR'
  }

  if (/missed penalty|penalty missed/i.test(normalized)) {
    return 'Pênalti perdido'
  }

  if (/own goal/i.test(normalized)) {
    return 'Gol contra'
  }

  if (/penalty/i.test(normalized) && !/miss/i.test(normalized)) {
    return 'Pênalti'
  }

  if (/normal goal/i.test(normalized) || /^goal$/i.test(normalized)) {
    return 'Gol'
  }

  if (/card upgrade|card updated/i.test(normalized)) {
    return 'Mudança de cartão'
  }

  if (/red card/i.test(normalized)) {
    return 'Cartão vermelho'
  }

  if (/yellow card/i.test(normalized)) {
    return 'Cartão amarelo'
  }

  if (/^card$/i.test(normalized)) {
    return 'Cartão'
  }

  return normalized
}

export function formatMatchGoalDetail(detail: string, isOwnGoal: boolean): string {
  if (isOwnGoal) {
    return 'Gol contra'
  }

  return translateMatchEventDetail(detail)
}

export function getMatchEventDetailClassName(detail: string): string {
  switch (detail) {
    case 'Gol':
      return 'font-medium text-emerald-400'
    case 'Cartão amarelo':
      return 'font-medium text-yellow-400'
    case 'Gol contra':
      return 'font-medium text-red-400'
    case 'Substituição':
    case 'Gol anulado':
      return 'font-medium text-orange-400'
    default:
      return ''
  }
}

export interface SubstitutionTimelineDisplay {
  title: string
  teamLabel: string
  playerOut: string | null
}

export function formatSubstitutionTimelineDisplay(
  playerIn: string,
  playerOut: string | null,
  teamLabel: string,
): SubstitutionTimelineDisplay {
  return {
    title: playerIn,
    teamLabel,
    playerOut,
  }
}
