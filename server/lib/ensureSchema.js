import { normalizePersonNameKey } from './participantKey.js'

async function countDuplicateBetKeys(sql) {
  const rows = await sql`
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT match_id, person_name_key
      FROM bets
      WHERE person_name_key IS NOT NULL
      GROUP BY match_id, person_name_key
      HAVING COUNT(*) > 1
    ) duplicates
  `

  return rows[0]?.total ?? 0
}

async function deduplicateActiveBets(sql) {
  await sql`
    UPDATE bets AS b
    SET person_name_key = NULL
    FROM receipts AS r
    WHERE b.receipt_id = r.id
      AND r.deleted_at IS NOT NULL
      AND b.person_name_key IS NOT NULL
  `

  const archived = await sql`
    WITH ranked AS (
      SELECT
        b.receipt_id,
        ROW_NUMBER() OVER (
          PARTITION BY b.match_id, b.person_name_key
          ORDER BY b.created_at ASC, b.id ASC
        ) AS row_number
      FROM bets b
      JOIN receipts r ON r.id = b.receipt_id
      WHERE r.deleted_at IS NULL
        AND b.person_name_key IS NOT NULL
    )
    UPDATE receipts
    SET deleted_at = NOW()
    WHERE id IN (
      SELECT receipt_id
      FROM ranked
      WHERE row_number > 1
    )
      AND deleted_at IS NULL
    RETURNING id
  `

  await sql`
    UPDATE bets AS b
    SET person_name_key = NULL
    FROM receipts AS r
    WHERE b.receipt_id = r.id
      AND r.deleted_at IS NOT NULL
      AND b.person_name_key IS NOT NULL
  `

  await sql`
    WITH ranked AS (
      SELECT
        b.id,
        ROW_NUMBER() OVER (
          PARTITION BY b.match_id, b.person_name_key
          ORDER BY b.created_at ASC, b.id ASC
        ) AS row_number
      FROM bets b
      WHERE b.person_name_key IS NOT NULL
    )
    UPDATE bets
    SET person_name_key = NULL
    WHERE id IN (
      SELECT id
      FROM ranked
      WHERE row_number > 1
    )
  `

  return archived.length
}

async function backfillPersonNameKeys(sql) {
  await sql`
    UPDATE bets AS b
    SET person_name_key = NULL
    FROM receipts AS r
    WHERE b.receipt_id = r.id
      AND r.deleted_at IS NOT NULL
  `

  const rows = await sql`
    SELECT b.id, b.person_name, b.person_name_key
    FROM bets b
    JOIN receipts r ON r.id = b.receipt_id
    WHERE r.deleted_at IS NULL
      AND b.person_name IS NOT NULL
      AND trim(b.person_name) <> ''
  `

  for (const row of rows) {
    const key = normalizePersonNameKey(row.person_name)

    if (!key || row.person_name_key === key) {
      continue
    }

    await sql`
      UPDATE bets
      SET person_name_key = ${key}
      WHERE id = ${row.id}
    `
  }
}

async function createSchemaStructure(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS receipts (
      id           TEXT PRIMARY KEY,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at   TIMESTAMPTZ
    )
  `

  await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`

  await sql`
    CREATE TABLE IF NOT EXISTS bets (
      id               SERIAL PRIMARY KEY,
      receipt_id       TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      match_id         INTEGER NOT NULL,
      home_score       INTEGER,
      away_score       INTEGER,
      winner_pick      TEXT,
      person_name      TEXT,
      person_name_key  TEXT,
      match_snapshot   JSONB NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ
    )
  `

  await sql`ALTER TABLE bets ADD COLUMN IF NOT EXISTS person_name_key TEXT`
  await sql`ALTER TABLE bets ADD COLUMN IF NOT EXISTS winner_pick TEXT`
  await sql`ALTER TABLE bets ALTER COLUMN home_score DROP NOT NULL`
  await sql`ALTER TABLE bets ALTER COLUMN away_score DROP NOT NULL`
  await sql`ALTER TABLE bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ`

  await sql`CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_bets_receipt_id ON bets(receipt_id)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_receipt_id_unique ON bets(receipt_id)`
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_match_person_active
    ON bets (match_id, person_name_key)
    WHERE person_name_key IS NOT NULL
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_receipts_active
    ON receipts (id)
    WHERE deleted_at IS NULL
  `

  await sql`
    CREATE TABLE IF NOT EXISTS bet_scores (
      receipt_id         TEXT PRIMARY KEY REFERENCES receipts(id) ON DELETE CASCADE,
      match_id           INTEGER NOT NULL,
      points             INTEGER NOT NULL DEFAULT 0,
      score_type         TEXT NOT NULL DEFAULT 'pending',
      home_team_points   INTEGER NOT NULL DEFAULT 0,
      away_team_points   INTEGER NOT NULL DEFAULT 0,
      actual_home_score  INTEGER,
      actual_away_score  INTEGER,
      computed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE bet_scores ADD COLUMN IF NOT EXISTS winner_points INTEGER NOT NULL DEFAULT 0`

  await sql`CREATE INDEX IF NOT EXISTS idx_bet_scores_match_id ON bet_scores(match_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_bet_scores_score_type ON bet_scores(score_type)`

  await sql`
    CREATE TABLE IF NOT EXISTS champion_bets (
      id               SERIAL PRIMARY KEY,
      receipt_id       TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      team_id          INTEGER NOT NULL,
      team_snapshot    JSONB NOT NULL,
      person_name      TEXT NOT NULL,
      person_name_key  TEXT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ
    )
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_champion_bets_receipt_id_unique ON champion_bets(receipt_id)
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_champion_bets_person_active ON champion_bets(person_name_key)
  `

  await sql`
    CREATE TABLE IF NOT EXISTS champion_scores (
      receipt_id       TEXT PRIMARY KEY REFERENCES receipts(id) ON DELETE CASCADE,
      final_match_id   INTEGER NOT NULL,
      points           INTEGER NOT NULL DEFAULT 0,
      score_type       TEXT NOT NULL DEFAULT 'pending',
      computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_name      TEXT NOT NULL,
      person_name_key  TEXT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_person_name_key
    ON participants (person_name_key)
  `

  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email TEXT`
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS password_hash TEXT`
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email
    ON participants (email)
    WHERE email IS NOT NULL
  `
}

/** Cria tabelas e índices idempotentes — seguro para rodar na primeira requisição da API. */
export async function ensureSchemaStructure(sql) {
  await createSchemaStructure(sql)
}

/** Migração completa: estrutura + backfill e deduplicação de dados legados. */
export async function ensureSchema(sql) {
  await createSchemaStructure(sql)

  await backfillPersonNameKeys(sql)

  const deduplicatedCount = await deduplicateActiveBets(sql)

  const remainingDuplicates = await countDuplicateBetKeys(sql)
  if (remainingDuplicates > 0) {
    throw new Error(
      `Ainda existem ${remainingDuplicates} grupo(s) duplicados em bets após a deduplicação. Revise os dados manualmente.`,
    )
  }

  return { deduplicatedCount }
}
