import type { Match } from './match'
import type { MatchBetRow } from '../utils/matchBetRows'
import type { ApiTeamDetail } from './api.types'

export interface BetsTableItem {
  matchId?: number
  match?: Match | null
  row: MatchBetRow
  championTeam?: ApiTeamDetail
}
