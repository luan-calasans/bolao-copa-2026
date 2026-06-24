import { neon } from '@neondatabase/serverless'

import { mergeBetComplement, validateBetComplement } from '../../shared/betComplement.js'

import { getPostgresConnectionString } from './loadLocalEnv.js'

import { normalizePersonNameKey } from './participantKey.js'

import { resetSchemaBootstrap, ensureSchemaReady } from './schemaBootstrap.js'

import { assertSafeReceiptId, assertSafeMatchId, ValidationError } from './validateInput.js'
import { getParticipantOwnedBetDeletionBlockReason } from './participantBetDeletion.js'

let betDbSqlProvider = null

export function setBetDbSqlProvider(provider) {
  betDbSqlProvider = provider
}

export function resetBetDbSqlProvider() {
  betDbSqlProvider = null
  resetSchemaBootstrap()
}

function getSql() {
  const connectionString = getPostgresConnectionString()

  if (!connectionString) {
    throw new Error(
      'POSTGRES_URL não configurado. Crie .env.local com POSTGRES_URL (Vercel → Storage → neon-banco → .env.local) ou conecte o banco ao projeto e faça redeploy.',
    )
  }

  return neon(connectionString)
}

export async function getReadySql() {
  if (betDbSqlProvider) {
    return betDbSqlProvider()
  }

  const sql = getSql()
  await ensureSchemaReady(sql)
  return sql
}

function rowToReceipt(row) {
  return {
    id: row.receipt_id,

    generatedAt: row.generated_at,

    bet: {
      matchId: row.match_id,

      homeScore: row.home_score,

      awayScore: row.away_score,

      winnerPick: row.winner_pick ?? undefined,

      personName: row.person_name ?? undefined,

      match: row.match_snapshot,

      createdAt: row.created_at,

      updatedAt: row.updated_at ?? undefined,
    },
  }
}

export function assertBetMatchesExisting(existingBet, incomingBet) {
  const existingName = (existingBet.personName ?? '').trim()

  const incomingName = (incomingBet.personName ?? '').trim()

  if (
    existingBet.matchId === incomingBet.matchId &&
    existingBet.homeScore === incomingBet.homeScore &&
    existingBet.awayScore === incomingBet.awayScore &&
    (existingBet.winnerPick ?? null) === (incomingBet.winnerPick ?? null) &&
    existingName === incomingName
  ) {
    return
  }

  throw new ValidationError('Este comprovante já foi registrado com dados diferentes.')
}

function isUniqueViolation(error) {
  return error && typeof error === 'object' && 'code' in error && error.code === '23505'
}

function isPersonPerMatchViolation(error) {
  if (!isUniqueViolation(error)) {
    return false
  }

  const details = [error.constraint, error.constraint_name, error.detail, error.message]

    .filter(Boolean)

    .join(' ')

  return details.includes('idx_bets_match_person_active')
}

function handleInsertError(error) {
  if (isPersonPerMatchViolation(error)) {
    throw new ValidationError('Você já registrou um palpite para este jogo.')
  }

  throw error
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

    LEFT JOIN bets b ON b.receipt_id = r.id

    WHERE r.id = ${receiptId}

      AND r.deleted_at IS NULL

      AND b.id IS NULL

    LIMIT 1

  `

  return rows.length > 0
}

async function insertBetRow(sql, safeReceiptId, bet) {
  const personNameKey = normalizePersonNameKey(bet.personName)

  await sql`

    INSERT INTO bets (

      receipt_id,

      match_id,

      home_score,

      away_score,

      winner_pick,

      person_name,

      person_name_key,

      match_snapshot,

      created_at

    )

    VALUES (

      ${safeReceiptId},

      ${bet.matchId},

      ${bet.homeScore},

      ${bet.awayScore},

      ${bet.winnerPick ?? null},

      ${bet.personName},

      ${personNameKey},

      ${bet.match},

      ${bet.createdAt}

    )

  `
}

export async function tryResolveExistingBet(receiptId, bet) {
  const safeReceiptId = assertSafeReceiptId(receiptId)

  const existing = await findReceiptById(safeReceiptId)

  if (!existing) {
    return null
  }

  assertBetMatchesExisting(existing.bet, bet)

  return safeReceiptId
}

export async function findBetByMatchAndPersonName(matchId, personName) {
  const safeMatchId = assertSafeMatchId(matchId)
  const personNameKey = normalizePersonNameKey(personName)

  if (!personNameKey) {
    return null
  }

  const sql = await getReadySql()

  const rows = await sql`

    SELECT

      b.receipt_id,

      b.match_id,

      b.home_score,

      b.away_score,

      b.winner_pick,

      b.person_name,

      b.match_snapshot,

      b.created_at,

      b.updated_at,

      r.generated_at

    FROM bets b

    JOIN receipts r ON r.id = b.receipt_id

    WHERE b.match_id = ${safeMatchId}

      AND b.person_name_key = ${personNameKey}

      AND r.deleted_at IS NULL

    LIMIT 1

  `

  if (!rows.length) {
    return null
  }

  const row = rows[0]

  return {
    receiptId: row.receipt_id,
    bet: {
      matchId: row.match_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      winnerPick: row.winner_pick ?? undefined,
      personName: row.person_name ?? undefined,
      match: row.match_snapshot,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
    },
    generatedAt: row.generated_at,
  }
}

async function updateBetComplement(sql, receiptId, mergedBet, incomingBet) {
  await sql`

    UPDATE bets

    SET
      home_score = ${mergedBet.homeScore},
      away_score = ${mergedBet.awayScore},
      winner_pick = ${mergedBet.winnerPick ?? null},
      match_snapshot = ${incomingBet.match},
      updated_at = NOW()

    WHERE receipt_id = ${receiptId}

  `
}

async function complementExistingBet(existingEntry, incomingBet) {
  const complementError = validateBetComplement(existingEntry.bet, incomingBet)

  if (complementError) {
    throw new ValidationError(complementError)
  }

  const merged = mergeBetComplement(existingEntry.bet, incomingBet)
  const sql = await getReadySql()

  await updateBetComplement(sql, existingEntry.receiptId, merged, incomingBet)

  return {
    receiptId: existingEntry.receiptId,
    created: false,
    complemented: true,
  }
}

export async function insertBetAndReceipt(receipt, bet) {
  const safeReceiptId = assertSafeReceiptId(receipt.id)

  const sql = await getReadySql()

  if (await findDeletedReceiptId(sql, safeReceiptId)) {
    throw new ValidationError('Este comprovante foi removido e não pode ser reutilizado.')
  }

  const storedByReceipt = await findReceiptById(safeReceiptId)

  if (storedByReceipt) {
    assertBetMatchesExisting(storedByReceipt.bet, bet)

    return {
      receiptId: safeReceiptId,
      created: false,
      complemented: false,
    }
  }

  const existingEntry = await findBetByMatchAndPersonName(bet.matchId, bet.personName)

  if (existingEntry) {
    return complementExistingBet(existingEntry, bet)
  }

  const isOrphan = await findOrphanReceiptId(sql, safeReceiptId)

  let created = true

  try {
    if (isOrphan) {
      await insertBetRow(sql, safeReceiptId, bet)
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
        await insertBetRow(sql, safeReceiptId, bet)
      }
    }
  } catch (error) {
    if (isUniqueViolation(error) && !isPersonPerMatchViolation(error)) {
      created = false
    } else {
      handleInsertError(error)
    }
  }

  let stored = await findReceiptById(safeReceiptId)

  if (!stored && (await findOrphanReceiptId(sql, safeReceiptId))) {
    try {
      await insertBetRow(sql, safeReceiptId, bet)
    } catch (error) {
      if (isUniqueViolation(error) && !isPersonPerMatchViolation(error)) {
        created = false
      } else {
        handleInsertError(error)
      }
    }

    stored = await findReceiptById(safeReceiptId)
  }

  if (!stored) {
    throw new Error('Não foi possível confirmar o registro do palpite.')
  }

  assertBetMatchesExisting(stored.bet, bet)

  return {
    receiptId: safeReceiptId,

    created,
  }
}

export async function findReceiptById(receiptId) {
  const safeReceiptId = assertSafeReceiptId(receiptId)

  const sql = await getReadySql()

  const rows = await sql`

    SELECT

      r.id AS receipt_id,

      r.generated_at,

      b.match_id,

      b.home_score,

      b.away_score,

      b.winner_pick,

      b.person_name,

      b.match_snapshot,

      b.created_at,

      b.updated_at

    FROM receipts r

    JOIN bets b ON b.receipt_id = r.id

    WHERE r.id = ${safeReceiptId}

      AND r.deleted_at IS NULL

    LIMIT 1

  `

  if (!rows.length) return null

  return rowToReceipt(rows[0])
}

function rowToMatchBet(row) {
  return {
    receiptId: row.receipt_id,

    matchId: row.match_id,

    homeScore: row.home_score,

    awayScore: row.away_score,

    winnerPick: row.winner_pick ?? undefined,

    personName: row.person_name ?? undefined,

    createdAt: row.created_at,

    updatedAt: row.updated_at ?? undefined,

    generatedAt: row.generated_at,
  }
}

export async function findBetsByMatchId(matchId) {
  const safeMatchId = assertSafeMatchId(matchId)

  const sql = await getReadySql()

  const rows = await sql`

    SELECT

      b.receipt_id,

      b.match_id,

      b.home_score,

      b.away_score,

      b.winner_pick,

      b.person_name,

      b.created_at,

      b.updated_at,

      r.generated_at

    FROM bets b

    JOIN receipts r ON r.id = b.receipt_id

    WHERE b.match_id = ${safeMatchId}

      AND r.deleted_at IS NULL

    ORDER BY b.created_at DESC

  `

  return rows.map(rowToMatchBet)
}

export async function findAllBets() {
  const sql = await getReadySql()

  const rows = await sql`

    SELECT

      b.receipt_id,

      b.match_id,

      b.home_score,

      b.away_score,

      b.winner_pick,

      b.person_name,

      b.created_at,

      b.updated_at,

      r.generated_at

    FROM bets b

    JOIN receipts r ON r.id = b.receipt_id

    WHERE r.deleted_at IS NULL

    ORDER BY b.created_at DESC

  `

  return rows.map(rowToMatchBet)
}

export async function findBetOwnerKeyByReceiptId(receiptId) {
  const safeReceiptId = assertSafeReceiptId(receiptId)
  const sql = await getReadySql()

  const rows = await sql`
    SELECT COALESCE(b.person_name_key, cb.person_name_key) AS person_name_key
    FROM receipts r
    LEFT JOIN bets b ON b.receipt_id = r.id
    LEFT JOIN champion_bets cb ON cb.receipt_id = r.id
    WHERE r.id = ${safeReceiptId}
      AND r.deleted_at IS NULL
      AND (b.receipt_id IS NOT NULL OR cb.receipt_id IS NOT NULL)
    LIMIT 1
  `

  return rows[0]?.person_name_key ?? null
}

export async function deleteBetByReceiptId(receiptId) {
  const safeReceiptId = assertSafeReceiptId(receiptId)

  const sql = await getReadySql()

  const rows = await sql`

    WITH cleared_champion AS (

      DELETE FROM champion_bets

      WHERE receipt_id = ${safeReceiptId}

      RETURNING receipt_id

    ),

    cleared_bet AS (

      UPDATE bets

      SET person_name_key = NULL

      WHERE receipt_id = ${safeReceiptId}

      RETURNING receipt_id

    )

    UPDATE receipts

    SET deleted_at = NOW()

    WHERE id = ${safeReceiptId}

      AND deleted_at IS NULL

    RETURNING id

  `

  return rows.length > 0
}

export async function findOwnedBetRecordByReceiptId(receiptId) {
  const safeReceiptId = assertSafeReceiptId(receiptId)
  const sql = await getReadySql()

  const rows = await sql`
    SELECT
      b.match_id,
      b.match_snapshot,
      cb.receipt_id AS champion_receipt_id
    FROM receipts r
    LEFT JOIN bets b ON b.receipt_id = r.id
    LEFT JOIN champion_bets cb ON cb.receipt_id = r.id
    WHERE r.id = ${safeReceiptId}
      AND r.deleted_at IS NULL
      AND (b.receipt_id IS NOT NULL OR cb.receipt_id IS NOT NULL)
    LIMIT 1
  `

  if (!rows.length) {
    return null
  }

  const row = rows[0]

  return {
    matchId: row.match_id ?? null,
    matchSnapshot: row.match_snapshot ?? null,
    isChampion: Boolean(row.champion_receipt_id),
  }
}

export async function deleteOwnedBetByReceiptId(receiptId, personNameKey) {
  const ownerKey = await findBetOwnerKeyByReceiptId(receiptId)

  if (!ownerKey) {
    return { deleted: false, reason: 'not_found' }
  }

  if (ownerKey !== personNameKey) {
    return { deleted: false, reason: 'forbidden' }
  }

  const record = await findOwnedBetRecordByReceiptId(receiptId)
  const blockMessage = await getParticipantOwnedBetDeletionBlockReason(record)

  if (blockMessage) {
    return { deleted: false, reason: 'closed', message: blockMessage }
  }

  const deleted = await deleteBetByReceiptId(receiptId)

  return { deleted, reason: deleted ? 'ok' : 'not_found' }
}
