export const PARTIAL_MAX_GOAL_DIFFERENCE = 3

function getMatchOutcome(home, away) {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

function getScoreGoalDifference(homeScore, awayScore, actualHome, actualAway) {
  return Math.abs(homeScore - actualHome) + Math.abs(awayScore - actualAway)
}

function isPartialScore(homeScore, awayScore, actualHome, actualAway) {
  const sameOutcome =
    getMatchOutcome(homeScore, awayScore) === getMatchOutcome(actualHome, actualAway)
  const withinGoalDifference =
    getScoreGoalDifference(homeScore, awayScore, actualHome, actualAway) <=
    PARTIAL_MAX_GOAL_DIFFERENCE

  return sameOutcome && withinGoalDifference
}

function getScorePoints(match, homeScore, awayScore) {
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
    return {
      points: 0,
      scoreType: 'pending',
      actualHomeScore: null,
      actualAwayScore: null,
    }
  }

  const actualHome = match.score.home
  const actualAway = match.score.away

  if (match.status !== 'finished' || actualHome === null || actualAway === null) {
    return {
      points: 0,
      scoreType: 'pending',
      actualHomeScore: null,
      actualAwayScore: null,
    }
  }

  if (homeScore === actualHome && awayScore === actualAway) {
    return {
      points: 10,
      scoreType: 'exact',
      actualHomeScore: actualHome,
      actualAwayScore: actualAway,
    }
  }

  if (isPartialScore(homeScore, awayScore, actualHome, actualAway)) {
    return {
      points: 3,
      scoreType: 'partial',
      actualHomeScore: actualHome,
      actualAwayScore: actualAway,
    }
  }

  return {
    points: 0,
    scoreType: 'none',
    actualHomeScore: actualHome,
    actualAwayScore: actualAway,
  }
}

function getWinnerPickPoints(match, winnerPick) {
  if (!winnerPick || match.status !== 'finished') {
    return 0
  }

  const actualHome = match.score.home
  const actualAway = match.score.away

  if (actualHome === null || actualAway === null) {
    return 0
  }

  return getMatchOutcome(actualHome, actualAway) === winnerPick ? 2 : 0
}

export function getBetScore(match, homeScore, awayScore, winnerPick = null) {
  const scoreResult = getScorePoints(match, homeScore, awayScore)
  const winnerPoints = getWinnerPickPoints(match, winnerPick)

  return {
    points: scoreResult.points + winnerPoints,
    scoreType: scoreResult.scoreType,
    winnerPoints,
    homeTeamPoints: 0,
    awayTeamPoints: 0,
    actualHomeScore: scoreResult.actualHomeScore,
    actualAwayScore: scoreResult.actualAwayScore,
  }
}

export const SCORING_RULES = [
  {
    title: 'Placar exato',
    points: '10 pts',
    description: 'Acertou o placar completo do jogo.',
  },
  {
    title: 'Acerto parcial',
    items: [
      {
        title: 'Placar',
        points: '3 pts',
        description:
          'Acertou quem venceu ou o empate pelo placar previsto, com diferença de no máximo 3 gols no total entre palpite e resultado.',
      },
      {
        title: 'Quem vence?',
        points: '2 pts',
        description: 'Acertou mandante, visitante ou empate na opção escolhida no palpite.',
      },
    ],
  },
  {
    title: 'Errou',
    points: '0 pts',
    description: 'Errou o resultado.',
  },
  {
    title: 'Campeão da Copa',
    points: '10 pts',
    description: 'Acertou a seleção vencedora da final. Palpite aceito até um dia antes da final.',
  },
]
