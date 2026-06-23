import { neon } from '@neondatabase/serverless'
import { getPostgresConnectionString } from '../server/lib/loadLocalEnv.js'
import { ensureSchema } from '../server/lib/ensureSchema.js'

const connectionString = getPostgresConnectionString()

if (!connectionString) {
  console.error(
    'Defina POSTGRES_URL em .env.local (copie de Vercel → Storage → neon-banco → .env.local).',
  )
  process.exit(1)
}

const sql = neon(connectionString)

console.log('Aplicando schema em neon-banco...')
const { deduplicatedCount } = await ensureSchema(sql)

if (deduplicatedCount > 0) {
  console.log(
    `Palpites duplicados arquivados (soft delete): ${deduplicatedCount}. Mantido o registro mais antigo por pessoa/jogo.`,
  )
}

console.log('Schema aplicado com sucesso.')
