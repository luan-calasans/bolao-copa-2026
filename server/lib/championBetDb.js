import { normalizePersonNameKey } from './participantKey.js'
import { getReadySql } from './betDb.js'
import { assertSafeReceiptId, ValidationError } from './validateInput.js'

function isUniqueViolation(error) {
  return error && typeof error === 'object' && 'code' in error && error.code === '23505'
}

function isPersonChampionBetViolation(error) {
  if (!isUniqueViolation(error)) {
    return false
  }

  const details = [error.constraint, error.constraint_name, error.detail, error.message]
    .filter(Boolean)
    .join(' ')

  return details.includes('idx_champion_bets_person_active')
}

function handleInsertError(error) {
  if (isPersonChampionBetViolation(error)) {
    throw new ValidationError('Você já registrou seu palpite de campeão.')
  }

  throw error
}

function rowToChampionBet(row) {
  return {
    receiptId: row.receipt_id,
    teamId: row.team_id,
    team: row.team_snapshot,
    personName: row.person_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    generatedAt: row.generated_at,
    points: row.points ?? undefined,
    scoreType: row.score_type ?? 'pending',
  }
}

export function assertChampionBetMatchesExisting(existingBet, incomingBet) {
  const existingName = (existingBet.personName ?? '').trim()
  const incomingName = (incomingBet.personName ?? '').trim()

  if (
    existingBet.teamId === incomingBet.teamId &&
    existingName === incomingName
  ) {
    return
  }

  throw new ValidationError('Este comprovante já foi registrado com dados diferentes.')
}

export async function tryResolveExistingChampionBet(receiptId, bet) {
  const safeReceiptId = assertSafeReceiptId(receiptId)
  const existing = await findChampionBetByReceiptId(safeReceiptId)

  if (!existing) {
    return null
  }

  assertChampionBetMatchesExisting(existing, bet)
  return safeReceiptId
}

export async function findChampionBetByReceiptId(receiptId) {
  const safeReceiptId = assertSafeReceiptId(receiptId)
  const sql = await getReadySql()

  const rows = await sql`
    SELECT
      cb.receipt_id,
      cb.team_id,
      cb.team_snapshot,
      cb.person_name,
      cb.created_at,
      cb.updated_at,
      cs.points,
      cs.score_type,
      r.generated_at
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    LEFT JOIN champion_scores cs ON cs.receipt_id = cb.receipt_id
    WHERE cb.receipt_id = ${safeReceiptId}
      AND r.deleted_at IS NULL
    LIMIT 1
  `

  if (!rows.length) {
    return null
  }

  return rowToChampionBet(rows[0])
}

export async function findChampionBetByPersonName(personName) {
  const personNameKey = normalizePersonNameKey(personName)

  if (!personNameKey) {
    return null
  }

  const sql = await getReadySql()

  const rows = await sql`
    SELECT
      cb.receipt_id,
      cb.team_id,
      cb.team_snapshot,
      cb.person_name,
      cb.created_at,
      cb.updated_at,
      r.generated_at
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    WHERE cb.person_name_key = ${personNameKey}
      AND r.deleted_at IS NULL
    LIMIT 1
  `

  if (!rows.length) {
    return null
  }

  return rowToChampionBet(rows[0])
}

async function findDeletedReceiptId(sql, receiptId) {
  const rows = await sql`
    SELECT id
    FROM receipts
    WHERE id = ${receiptId}
      AND deleted_at IS NOT NULL
    LIMIT 1
  `

  return rows.length > 0
}

async function findOrphanReceiptId(sql, receiptId) {
  const rows = await sql`
    SELECT r.id
    FROM receipts r
    LEFT JOIN champion_bets cb ON cb.receipt_id = r.id
    WHERE r.id = ${receiptId}
      AND r.deleted_at IS NULL
      AND cb.id IS NULL
    LIMIT 1
  `

  return rows.length > 0
}

async function insertChampionBetRow(sql, safeReceiptId, bet) {
  const personNameKey = normalizePersonNameKey(bet.personName)

  await sql`
    INSERT INTO champion_bets (
      receipt_id,
      team_id,
      team_snapshot,
      person_name,
      person_name_key,
      created_at
    )
    VALUES (
      ${safeReceiptId},
      ${bet.teamId},
      ${bet.team},
      ${bet.personName},
      ${personNameKey},
      ${bet.createdAt}
    )
  `
}

export async function insertChampionBetAndReceipt(receipt, bet) {
  const safeReceiptId = assertSafeReceiptId(receipt.id)
  const sql = await getReadySql()

  if (await findDeletedReceiptId(sql, safeReceiptId)) {
    throw new ValidationError('Este comprovante foi removido e não pode ser reutilizado.')
  }

  const storedByReceipt = await findChampionBetByReceiptId(safeReceiptId)

  if (storedByReceipt) {
    assertChampionBetMatchesExisting(storedByReceipt, bet)
    return {
      receiptId: safeReceiptId,
      created: false,
    }
  }

  const existingByPerson = await findChampionBetByPersonName(bet.personName)

  if (existingByPerson) {
    throw new ValidationError('Você já registrou seu palpite de campeão.')
  }

  const isOrphan = await findOrphanReceiptId(sql, safeReceiptId)
  let created = true

  try {
    if (isOrphan) {
      await insertChampionBetRow(sql, safeReceiptId, bet)
    } else {
      const insertedReceipt = await sql`
        INSERT INTO receipts (id, generated_at)
        VALUES (${safeReceiptId}, ${receipt.generatedAt})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `

      if (insertedReceipt.length === 0) {
        created = false
      } else {
        await insertChampionBetRow(sql, safeReceiptId, bet)
      }
    }
  } catch (error) {
    if (isUniqueViolation(error) && !isPersonChampionBetViolation(error)) {
      created = false
    } else {
      handleInsertError(error)
    }
  }

  let stored = await findChampionBetByReceiptId(safeReceiptId)

  if (!stored && (await findOrphanReceiptId(sql, safeReceiptId))) {
    try {
      await insertChampionBetRow(sql, safeReceiptId, bet)
    } catch (error) {
      if (isUniqueViolation(error) && !isPersonChampionBetViolation(error)) {
        created = false
      } else {
        handleInsertError(error)
      }
    }

    stored = await findChampionBetByReceiptId(safeReceiptId)
  }

  if (!stored) {
    throw new Error('Não foi possível confirmar o registro do palpite de campeão.')
  }

  assertChampionBetMatchesExisting(stored, bet)

  return {
    receiptId: safeReceiptId,
    created,
  }
}

export async function findAllChampionBets() {
  const sql = await getReadySql()

  const rows = await sql`
    SELECT
      cb.receipt_id,
      cb.team_id,
      cb.team_snapshot,
      cb.person_name,
      cb.created_at,
      cb.updated_at,
      cs.points,
      cs.score_type,
      r.generated_at
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    LEFT JOIN champion_scores cs ON cs.receipt_id = cb.receipt_id
    WHERE r.deleted_at IS NULL
    ORDER BY cb.created_at DESC
  `

  return rows.map(rowToChampionBet)
}

export async function findChampionScoresForSync() {
  const sql = await getReadySql()

  return sql`
    SELECT
      cb.receipt_id,
      cb.team_id,
      cs.score_type,
      cs.points
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    LEFT JOIN champion_scores cs ON cs.receipt_id = cb.receipt_id
    WHERE r.deleted_at IS NULL
  `
}

export async function upsertChampionScores(rows) {
  if (rows.length === 0) {
    return
  }

  const sql = await getReadySql()
  const receiptIds = rows.map((row) => row.receiptId)
  const finalMatchIds = rows.map((row) => row.finalMatchId)
  const points = rows.map((row) => row.points)
  const scoreTypes = rows.map((row) => row.scoreType)

  await sql`
    INSERT INTO champion_scores (
      receipt_id,
      final_match_id,
      points,
      score_type,
      computed_at
    )
    SELECT
      receipt_id,
      final_match_id,
      points,
      score_type,
      NOW()
    FROM UNNEST(
      ${receiptIds}::text[],
      ${finalMatchIds}::int[],
      ${points}::int[],
      ${scoreTypes}::text[]
    ) AS input(
      receipt_id,
      final_match_id,
      points,
      score_type
    )
    ON CONFLICT (receipt_id) DO UPDATE SET
      final_match_id = EXCLUDED.final_match_id,
      points = EXCLUDED.points,
      score_type = EXCLUDED.score_type,
      computed_at = NOW()
  `
}
