import type { ApiTeamDetail, ApiTeamsResponse } from '../models/api.types'
import teamsSeason2026 from '../data/teams-season2026.json'

export function getWorldCupTeamsSeason2026(): ApiTeamDetail[] {
  const data = teamsSeason2026 as ApiTeamsResponse
  return data.teams ?? []
}
