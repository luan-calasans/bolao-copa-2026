export {
  fetchCompetitionStandings,
  fetchCompetitionTeams,
  fetchWorldCupStandings,
  fetchWorldCupTeams,
} from './competitionService'
export { WORLD_CUP_CODE, WORLD_CUP_ID, WORLD_CUP_SEASON } from './footballConstants'
export { fetchMatchById, fetchWorldCupMatches } from './matchService'
export {
  fetchTeamById,
  fetchTeamMatches,
  fetchTeamMatchesMapped,
  type FetchTeamMatchesOptions,
} from './teamService'
