import { neon } from '@neondatabase/serverless'
import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'
import { normalizeEmail } from '../../shared/participantCredentials.js'
import { normalizePersonNameKey } from './participantKey.js'
import { getPostgresConnectionString } from './loadLocalEnv.js'
import { ensureSchemaReady } from './schemaBootstrap.js'
import { hashParticipantPassword, verifyParticipantPassword } from './participantPassword.js'

function getSql() {
  const connectionString = getPostgresConnectionString()

  if (!connectionString) {
    throw new Error('POSTGRES_URL não configurado.')
  }

  return neon(connectionString)
}

function mapParticipant(row) {
  return {
    id: row.id,
    person_name: row.person_name,
    person_name_key: row.person_name_key,
    email: row.email,
    created_at: row.created_at,
  }
}

export async function findParticipantByEmail(email) {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return null
  }

  const rows = await sql`
    SELECT id, person_name, person_name_key, email, password_hash, created_at
    FROM participants
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function findParticipantByKey(personNameKey) {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const rows = await sql`
    SELECT id, person_name, person_name_key, email, password_hash, created_at
    FROM participants
    WHERE person_name_key = ${personNameKey}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function countLegacyBetsForKey(personNameKey) {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const matchRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM bets b
    JOIN receipts r ON r.id = b.receipt_id
    WHERE r.deleted_at IS NULL
      AND b.person_name_key = ${personNameKey}
  `

  const championRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM champion_bets cb
    JOIN receipts r ON r.id = cb.receipt_id
    WHERE r.deleted_at IS NULL
      AND cb.person_name_key = ${personNameKey}
  `

  return (matchRows[0]?.total ?? 0) + (championRows[0]?.total ?? 0)
}

export async function authenticateParticipantByEmail(email, password) {
  const participant = await findParticipantByEmail(email)

  if (!participant?.password_hash) {
    return null
  }

  const isValid = verifyParticipantPassword(password, participant.password_hash)

  if (!isValid) {
    return null
  }

  return mapParticipant(participant)
}

export async function registerParticipant({ personName, email, password }) {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const formattedName = formatPersonNameForStorage(personName)
  const personNameKey = normalizePersonNameKey(formattedName)
  const normalizedEmail = normalizeEmail(email)

  if (!personNameKey) {
    throw new Error('Nome inválido.')
  }

  const existingName = await findParticipantByKey(personNameKey)

  if (existingName) {
    throw new Error('Este nome já está cadastrado no bolão.')
  }

  const existingEmail = await findParticipantByEmail(normalizedEmail)

  if (existingEmail) {
    throw new Error('Este e-mail já está cadastrado.')
  }

  const legacyBetCount = await countLegacyBetsForKey(personNameKey)

  if (legacyBetCount > 0) {
    throw new Error(
      'Este nome já possui palpites anteriores. Use a opção "Já palpitei" para vincular sua conta.',
    )
  }

  const passwordHash = hashParticipantPassword(password)

  const rows = await sql`
    INSERT INTO participants (person_name, person_name_key, email, password_hash)
    VALUES (${formattedName}, ${personNameKey}, ${normalizedEmail}, ${passwordHash})
    RETURNING id, person_name, person_name_key, email, created_at
  `

  return mapParticipant(rows[0])
}

export async function claimLegacyParticipant({ personName, email, password }) {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const formattedName = formatPersonNameForStorage(personName)
  const personNameKey = normalizePersonNameKey(formattedName)
  const normalizedEmail = normalizeEmail(email)

  if (!personNameKey) {
    throw new Error('Nome inválido.')
  }

  const existingName = await findParticipantByKey(personNameKey)

  if (existingName) {
    throw new Error('Este nome já possui cadastro. Faça login com seu e-mail e senha.')
  }

  const existingEmail = await findParticipantByEmail(normalizedEmail)

  if (existingEmail) {
    throw new Error('Este e-mail já está cadastrado.')
  }

  const legacyBetCount = await countLegacyBetsForKey(personNameKey)

  if (legacyBetCount === 0) {
    throw new Error(
      'Não encontramos palpites anteriores com este nome. Crie um cadastro novo ou verifique o nome digitado.',
    )
  }

  const passwordHash = hashParticipantPassword(password)

  const rows = await sql`
    INSERT INTO participants (person_name, person_name_key, email, password_hash)
    VALUES (${formattedName}, ${personNameKey}, ${normalizedEmail}, ${passwordHash})
    RETURNING id, person_name, person_name_key, email, created_at
  `

  return {
    participant: mapParticipant(rows[0]),
    legacyBetCount,
  }
}

export async function findUnclaimedLegacyParticipants() {
  const sql = getSql()
  await ensureSchemaReady(sql)

  const rows = await sql`
    WITH legacy_bets AS (
      SELECT b.person_name_key, b.person_name
      FROM bets b
      INNER JOIN receipts r ON r.id = b.receipt_id AND r.deleted_at IS NULL
      WHERE b.person_name_key IS NOT NULL

      UNION ALL

      SELECT cb.person_name_key, cb.person_name
      FROM champion_bets cb
      INNER JOIN receipts r ON r.id = cb.receipt_id AND r.deleted_at IS NULL
    ),
    grouped AS (
      SELECT
        person_name_key,
        MAX(person_name) FILTER (
          WHERE person_name IS NOT NULL AND trim(person_name) <> ''
        ) AS display_name,
        COUNT(*)::int AS legacy_bet_count
      FROM legacy_bets
      GROUP BY person_name_key
    )
    SELECT
      g.person_name_key,
      g.display_name,
      g.legacy_bet_count
    FROM grouped g
    WHERE NOT EXISTS (
      SELECT 1
      FROM participants p
      WHERE p.person_name_key = g.person_name_key
        AND p.password_hash IS NOT NULL
        AND p.email IS NOT NULL
    )
    ORDER BY g.display_name ASC
  `

  return rows.map((row) => ({
    personNameKey: row.person_name_key,
    displayName: row.display_name ?? row.person_name_key,
    legacyBetCount: row.legacy_bet_count ?? 0,
  }))
}

export async function getLegacyNamePreview(personName) {
  const formattedName = formatPersonNameForStorage(personName)
  const personNameKey = normalizePersonNameKey(formattedName)

  if (!personNameKey) {
    return { status: 'invalid' }
  }

  const existing = await findParticipantByKey(personNameKey)

  if (existing) {
    return {
      status: 'registered',
      displayName: existing.person_name,
    }
  }

  const legacyBetCount = await countLegacyBetsForKey(personNameKey)

  if (legacyBetCount > 0) {
    return {
      status: 'claimable',
      displayName: formattedName,
      legacyBetCount,
    }
  }

  return {
    status: 'no_bets',
    displayName: formattedName,
  }
}
