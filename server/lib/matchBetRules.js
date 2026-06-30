import { getBetAcceptanceBlockReason } from '../../shared/matchBetAcceptance.js'
import { resolveRegulationScoreFromApi } from '../../shared/footballApiScore.js'
import { normalizeMatchStatus } from '../../shared/matchStatus.js'
import { getLiveMinScores, validateBetScores as getBetScoresValidationError, hasBetScorePick } from '../../shared/betValidation.js'
import { ValidationError } from './validateInput.js'

function areTeamsDefined(apiMatch) {
  const home = apiMatch.homeTeam?.name?.trim()
  const away = apiMatch.awayTeam?.name?.trim()
  return Boolean(home && away)
}

function toBetAcceptanceInput(apiMatch) {
  return {
    teamsDefined: areTeamsDefined(apiMatch),
    status: normalizeMatchStatus(apiMatch.status),
    utcDate: apiMatch.utcDate,
  }
}

export function assertMatchAcceptsBets(apiMatch) {
  if (!apiMatch || typeof apiMatch !== 'object') {
    throw new ValidationError('Jogo não encontrado.')
  }

  const reason = getBetAcceptanceBlockReason(toBetAcceptanceInput(apiMatch))

  if (reason) {
    throw new ValidationError(reason)
  }
}

export function assertBetScoresAllowed(apiMatch, homeScore, awayScore) {
  if (!hasBetScorePick(homeScore, awayScore)) {
    return
  }

  const status = normalizeMatchStatus(apiMatch.status)
  const regulationScore = resolveRegulationScoreFromApi(apiMatch.score)
  const min = getLiveMinScores(
    status === 'live',
    regulationScore.home,
    regulationScore.away,
  )
  const validationError = getBetScoresValidationError(min.home, min.away, homeScore, awayScore)

  if (validationError) {
    throw new ValidationError(validationError)
  }
}
