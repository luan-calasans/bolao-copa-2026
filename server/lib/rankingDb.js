import { computeHitRateEfficiency } from '../../shared/betEfficiency.js'
import { getChampionBetScore } from '../../shared/championBetScoring.js'
import { findWorldCupFinalMatch } from '../../shared/finalMatch.js'
import { fetchWorldCupMatches, fetchWorldCupMatchesForChampion, mapMatchesById } from './footballApi.js'
import { findChampionScoresForSync, upsertChampionScores } from './championBetDb.js'
import { getReadySql } from './betDb.js'
import { normalizePersonNameKey } from './participantKey.js'
import { computeBetScore, isBetScoreSyncCandidate, needsBetScoreSync } from './rankingSync.js'

const UPSERT_BATCH_SIZE = 100

function getDisplayName(name) {
  return name?.trim() || 'Sem nome'
}

async function upsertBetScoresBatch(sql, rows) {
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_BATCH_SIZE)
    const receiptIds = chunk.map((row) => row.receiptId)
    const matchIds = chunk.map((row) => row.matchId)
    const points = chunk.map((row) => row.points)
    const scoreTypes = chunk.map((row) => row.scoreType)
    const winnerPoints = chunk.map((row) => row.winnerPoints)
    const homeTeamPoints = chunk.map((row) => row.homeTeamPoints)
    const awayTeamPoints = chunk.map((row) => row.awayTeamPoints)
    const actualHomeScores = chunk.map((row) => row.actualHomeScore)
    const actualAwayScores = chunk.map((row) => row.actualAwayScore)

    await sql`
      INSERT INTO bet_scores (
        receipt_id,
        match_id,
        points,
        score_type,
        winner_points,
        home_team_points,
        away_team_points,
        actual_home_score,
        actual_away_score,
        computed_at
      )
      SELECT
        receipt_id,
        match_id,
        points,
        score_type,
        winner_points,
        home_team_points,
        away_team_points,
        actual_home_score,
        actual_away_score,
        NOW()
      FROM UNNEST(
        ${receiptIds}::text[],
        ${matchIds}::int[],
        ${points}::int[],
        ${scoreTypes}::text[],
        ${winnerPoints}::int[],
        ${homeTeamPoints}::int[],
        ${awayTeamPoints}::int[],
        ${actualHomeScores}::int[],
        ${actualAwayScores}::int[]
      ) AS input(
        receipt_id,
        match_id,
        points,
        score_type,
        winner_points,
        home_team_points,
        away_team_points,
        actual_home_score,
        actual_away_score
      )
      ON CONFLICT (receipt_id) DO UPDATE SET
        match_id = EXCLUDED.match_id,
        points = EXCLUDED.points,
        score_type = EXCLUDED.score_type,
        winner_points = EXCLUDED.winner_points,
        home_team_points = EXCLUDED.home_team_points,
        away_team_points = EXCLUDED.away_team_points,
        actual_home_score = EXCLUDED.actual_home_score,
        actual_away_score = EXCLUDED.actual_away_score,
        computed_at = NOW()
    `
  }
}

export async function syncBetScores() {
  const sql = await getReadySql()
  const rows = await sql`
    SELECT
      b.receipt_id,
      b.match_id,
      b.home_score,
      b.away_score,
      b.winner_pick,
      bs.score_type,
      bs.points,
      bs.winner_points,
      bs.home_team_points,
      bs.away_team_points,
      bs.actual_home_score,
      bs.actual_away_score
    FROM bets b
    JOIN receipts r ON r.id = b.receipt_id
    LEFT JOIN bet_scores bs ON bs.receipt_id = b.receipt_id
    WHERE r.deleted_at IS NULL
  `

  if (rows.length === 0) {
    return 0
  }

  const candidates = rows.filter(isBetScoreSyncCandidate)

  const matches = await fetchWorldCupMatches()
  const matchesById = mapMatchesById(matches)
  const toUpsert = []

  for (const bet of candidates) {
    const match = matchesById.get(bet.match_id) ?? null
    const computed = computeBetScore(match, bet)
    const existing = bet.score_type
      ? {
          score_type: bet.score_type,
          points: bet.points,
          home_team_points: bet.home_team_points,
          away_team_points: bet.away_team_points,
          winner_points: bet.winner_points,
          actual_home_score: bet.actual_home_score,
          actual_away_score: bet.actual_away_score,
        }
      : null

    if (!needsBetScoreSync(existing, computed)) {
      continue
    }

    toUpsert.push({
      receiptId: bet.receipt_id,
      matchId: bet.match_id,
      points: computed.points,
      scoreType: computed.scoreType,
      winnerPoints: computed.winnerPoints,
      homeTeamPoints: computed.homeTeamPoints,
      awayTeamPoints: computed.awayTeamPoints,
      actualHomeScore: computed.actualHomeScore,
      actualAwayScore: computed.actualAwayScore,
    })
  }

  await upsertBetScoresBatch(sql, toUpsert)

  return toUpsert.length
}

async function syncChampionScores() {
  const rows = await findChampionScoresForSync()

  if (rows.length === 0) {
    return 0
  }

  const matches = await fetchWorldCupMatchesForChampion()
  const finalMatch = findWorldCupFinalMatch(matches)

  if (!finalMatch) {
    return 0
  }

  const toUpsert = []

  for (const row of rows) {
    const computed = getChampionBetScore(row.team_id, finalMatch)
    const existingScoreType = row.score_type ?? null
    const existingPoints = row.points ?? null

    if (existingScoreType === computed.scoreType && existingPoints === computed.points) {
      continue
    }

    if (
      existingScoreType &&
      existingScoreType !== 'pending' &&
      computed.scoreType === 'pending'
    ) {
      continue
    }

    toUpsert.push({
      receiptId: row.receipt_id,
      finalMatchId: finalMatch.id,
      points: computed.points,
      scoreType: computed.scoreType,
    })
  }

  await upsertChampionScores(toUpsert)
  return toUpsert.length
}

export async function getRankingFromDb() {
  const sql = await getReadySql()

  const rows = await sql`
    SELECT
      b.person_name,
      b.created_at,
      bs.points,
      bs.score_type
    FROM bets b
    JOIN receipts r ON r.id = b.receipt_id
    LEFT JOIN bet_scores bs ON bs.receipt_id = b.receipt_id
    WHERE r.deleted_at IS NULL
    ORDER BY b.created_at DESC
  `

  const championRows = await sql`
    SELECT
      cb.person_name,
      cb.created_at,
      cs.points,
      cs.score_type
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    LEFT JOIN champion_scores cs ON cs.receipt_id = cb.receipt_id
    WHERE r.deleted_at IS NULL
    ORDER BY cb.created_at DESC
  `

  const rankingMap = new Map()

  for (const row of [...rows, ...championRows]) {
    const key = normalizePersonNameKey(row.person_name) || 'sem nome'
    const displayName = getDisplayName(row.person_name)
    const points = row.points ?? 0
    const scoreType = row.score_type ?? 'pending'

    const current = rankingMap.get(key) ?? {
      personNameKey: key,
      displayName,
      totalPoints: 0,
      exactHits: 0,
      partialHits: 0,
      missedHits: 0,
      pendingBets: 0,
      totalBets: 0,
      hitRateEfficiency: null,
    }

    current.totalBets += 1
    current.totalPoints += points

    if (scoreType === 'exact') {
      current.exactHits += 1
    } else if (scoreType === 'partial') {
      current.partialHits += 1
    } else if (scoreType === 'pending') {
      current.pendingBets += 1
    } else if (scoreType === 'none') {
      current.missedHits += 1
    }

    rankingMap.set(key, current)
  }

  for (const row of rankingMap.values()) {
    row.hitRateEfficiency = computeHitRateEfficiency(
      row.exactHits,
      row.partialHits,
      row.missedHits,
    )
  }

  return Array.from(rankingMap.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits
    if (b.partialHits !== a.partialHits) return b.partialHits - a.partialHits
    return a.displayName.localeCompare(b.displayName, 'pt-BR')
  })
}

async function buildRankingSnapshot() {
  await syncBetScores()
  await syncChampionScores()
  const ranking = await getRankingFromDb()

  return {
    syncedAt: new Date().toISOString(),
    ranking,
  }
}

export async function getRankingSnapshot() {
  return buildRankingSnapshot()
}
