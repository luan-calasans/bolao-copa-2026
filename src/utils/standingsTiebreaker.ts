import type { ApiStandingRow } from '../models/api.types'

/** Campos opcionais para critérios de desempate ainda não disponíveis na API. */
export interface ExtendedStandingStats {
  fairPlayPoints?: number | null
  fifaRanking?: number | null
}

export type StandingRowWithTiebreakers = ApiStandingRow & ExtendedStandingStats

/**
 * Compara duas equipes pelos critérios da fase de grupos da Copa 2026:
 * pontos → saldo → gols marcados → fair play → ranking FIFA → nome.
 */
export function compareStandingRows(
  a: StandingRowWithTiebreakers,
  b: StandingRowWithTiebreakers,
): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor

  const fairPlayA = a.fairPlayPoints
  const fairPlayB = b.fairPlayPoints
  if (fairPlayA != null && fairPlayB != null && fairPlayB !== fairPlayA) {
    return fairPlayB - fairPlayA
  }

  const rankingA = a.fifaRanking
  const rankingB = b.fifaRanking
  if (rankingA != null && rankingB != null && rankingA !== rankingB) {
    return rankingA - rankingB
  }

  return (a.team.name ?? '').localeCompare(b.team.name ?? '', 'pt-BR')
}
