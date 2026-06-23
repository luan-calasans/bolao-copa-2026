import { normalizePersonNameKey } from '../../server/lib/participantKey.js'

function normalizeQuery(strings) {
  return strings.join('?').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function createInMemoryBetDb() {
  const receipts = new Map()
  const bets = new Map()
  let betId = 1

  const sql = async (strings, ...values) => {
    const query = normalizeQuery(strings)

    if (query.includes('from receipts') && query.includes('deleted_at is not null')) {
      const receiptId = values[0]
      const receipt = receipts.get(receiptId)
      return receipt?.deleted_at ? [{ id: receiptId }] : []
    }

    if (
      query.includes('from receipts r') &&
      query.includes('left join bets') &&
      query.includes('b.id is null')
    ) {
      const receiptId = values[0]
      const receipt = receipts.get(receiptId)
      if (receipt && !receipt.deleted_at && !bets.has(receiptId)) {
        return [{ id: receiptId }]
      }
      return []
    }

    if (query.includes('insert into receipts')) {
      const [receiptId, generatedAt] = values
      if (receipts.has(receiptId)) {
        return []
      }
      receipts.set(receiptId, { id: receiptId, generated_at: generatedAt, deleted_at: null })
      return [{ id: receiptId }]
    }

    if (query.includes('insert into bets')) {
      const [
        receiptId,
        matchId,
        homeScore,
        awayScore,
        winnerPick,
        personName,
        personNameKey,
        matchSnapshot,
        createdAt,
      ] = values

      for (const bet of bets.values()) {
        const receipt = receipts.get(bet.receipt_id)
        if (
          receipt &&
          !receipt.deleted_at &&
          bet.match_id === matchId &&
          bet.person_name_key === personNameKey &&
          bet.receipt_id !== receiptId
        ) {
          const error = new Error('duplicate person per match')
          error.code = '23505'
          error.constraint = 'idx_bets_match_person_active'
          throw error
        }
      }

      if (bets.has(receiptId)) {
        const error = new Error('duplicate receipt')
        error.code = '23505'
        error.constraint = 'idx_bets_receipt_id_unique'
        throw error
      }

      bets.set(receiptId, {
        id: betId++,
        receipt_id: receiptId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        winner_pick: winnerPick,
        person_name: personName,
        person_name_key: personNameKey,
        match_snapshot: matchSnapshot,
        created_at: createdAt,
        updated_at: null,
      })

      return []
    }

    if (query.includes('from receipts r') && query.includes('join bets b')) {
      const receiptId = values[0]
      const receipt = receipts.get(receiptId)
      const bet = bets.get(receiptId)

      if (!receipt || receipt.deleted_at || !bet) {
        return []
      }

      return [
        {
          receipt_id: receiptId,
          generated_at: receipt.generated_at,
          match_id: bet.match_id,
          home_score: bet.home_score,
          away_score: bet.away_score,
          winner_pick: bet.winner_pick,
          person_name: bet.person_name,
          match_snapshot: bet.match_snapshot,
          created_at: bet.created_at,
          updated_at: bet.updated_at,
        },
      ]
    }

    if (
      query.includes('from bets b') &&
      query.includes('join receipts r') &&
      query.includes('b.person_name_key')
    ) {
      const [matchId, personNameKey] = values

      for (const [receiptId, bet] of bets.entries()) {
        const receipt = receipts.get(receiptId)
        if (
          !receipt ||
          receipt.deleted_at ||
          bet.match_id !== matchId ||
          bet.person_name_key !== personNameKey
        ) {
          continue
        }

        return [
          {
            receipt_id: receiptId,
            match_id: bet.match_id,
            home_score: bet.home_score,
            away_score: bet.away_score,
            winner_pick: bet.winner_pick,
            person_name: bet.person_name,
            match_snapshot: bet.match_snapshot,
            created_at: bet.created_at,
            updated_at: bet.updated_at,
            generated_at: receipt.generated_at,
          },
        ]
      }

      return []
    }

    if (query.startsWith('update bets')) {
      const [homeScore, awayScore, winnerPick, matchSnapshot, receiptId] = values
      const bet = bets.get(receiptId)

      if (!bet) {
        return []
      }

      bets.set(receiptId, {
        ...bet,
        home_score: homeScore,
        away_score: awayScore,
        winner_pick: winnerPick,
        match_snapshot: matchSnapshot,
        updated_at: new Date().toISOString(),
      })

      return []
    }

    if (
      query.includes('from bets b') &&
      query.includes('join receipts r') &&
      query.includes('where b.match_id')
    ) {
      const matchId = values[0]
      const rows = []

      for (const [receiptId, bet] of bets.entries()) {
        const receipt = receipts.get(receiptId)
        if (!receipt || receipt.deleted_at || bet.match_id !== matchId) {
          continue
        }

        rows.push({
          receipt_id: receiptId,
          match_id: bet.match_id,
          home_score: bet.home_score,
          away_score: bet.away_score,
          winner_pick: bet.winner_pick,
          person_name: bet.person_name,
          created_at: bet.created_at,
          updated_at: bet.updated_at,
          generated_at: receipt.generated_at,
        })
      }

      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }

    if (
      query.includes('from bets b') &&
      query.includes('join receipts r') &&
      query.includes('where r.deleted_at is null')
    ) {
      const rows = []

      for (const [receiptId, bet] of bets.entries()) {
        const receipt = receipts.get(receiptId)
        if (!receipt || receipt.deleted_at) {
          continue
        }

        rows.push({
          receipt_id: receiptId,
          match_id: bet.match_id,
          home_score: bet.home_score,
          away_score: bet.away_score,
          winner_pick: bet.winner_pick,
          person_name: bet.person_name,
          created_at: bet.created_at,
          updated_at: bet.updated_at,
          generated_at: receipt.generated_at,
        })
      }

      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }

    throw new Error(`Unhandled SQL in test mock: ${query}`)
  }

  return {
    sql,
    seedReceipt(receiptId, { generatedAt, deletedAt = null, bet = null }) {
      receipts.set(receiptId, {
        id: receiptId,
        generated_at: generatedAt,
        deleted_at: deletedAt,
      })

      if (bet) {
        bets.set(receiptId, {
          id: betId++,
          receipt_id: receiptId,
          match_id: bet.matchId,
          home_score: bet.homeScore,
          away_score: bet.awayScore,
          winner_pick: bet.winnerPick ?? null,
          person_name: bet.personName,
          person_name_key: normalizePersonNameKey(bet.personName),
          match_snapshot: bet.match,
          created_at: bet.createdAt,
        })
      }
    },
  }
}
