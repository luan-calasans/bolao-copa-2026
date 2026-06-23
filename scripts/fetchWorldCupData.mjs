import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outDir = resolve(rootDir, 'public/data')
const outFile = resolve(outDir, 'wc-matches-2026.json')
const apiUrl = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026'

function loadEnvFile() {
  const envPath = resolve(rootDir, '.env')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile()

const token = process.env.VITE_FOOTBALL_API_TOKEN

if (!token) {
  if (existsSync(outFile)) {
    console.warn(
      'VITE_FOOTBALL_API_TOKEN ausente; mantendo public/data/wc-matches-2026.json existente.',
    )
    process.exit(0)
  }

  console.error('VITE_FOOTBALL_API_TOKEN é obrigatório para gerar os dados dos jogos.')
  process.exit(1)
}

const response = await fetch(apiUrl, {
  headers: { 'X-Auth-Token': token },
})

if (!response.ok) {
  const body = await response.text()
  console.error(`Falha ao buscar jogos (${response.status}): ${body}`)
  process.exit(1)
}

const data = await response.json()
mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, `${JSON.stringify(data, null, 2)}\n`)

console.log(`Salvos ${data.matches?.length ?? 0} jogos em public/data/wc-matches-2026.json`)
