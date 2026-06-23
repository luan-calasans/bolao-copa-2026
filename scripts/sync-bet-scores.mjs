import { getPostgresConnectionString } from '../server/lib/loadLocalEnv.js'
import { syncBetScores } from '../server/lib/rankingDb.js'

if (!getPostgresConnectionString()) {
  console.error(
    'Defina POSTGRES_URL em .env.local (copie de Vercel → Storage → neon-banco → .env.local).',
  )
  process.exit(1)
}

console.log('Recalculando pontuação dos palpites...')
const updatedCount = await syncBetScores()
console.log(`Palpites atualizados: ${updatedCount}.`)
