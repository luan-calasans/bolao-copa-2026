import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outDir = resolve(rootDir, 'public/teams')
const indexFile = resolve(outDir, 'index.json')
const srcCrestsFile = resolve(rootDir, 'src/data/teamCrests.json')
const teamsApiUrl = 'https://api.football-data.org/v4/competitions/WC/teams?season=2026'

/** Seleções frequentes no histórico que não estão na Copa 2026. */
const EXTRA_HISTORICAL_TEAMS = [
  { id: 784, name: 'Italy', tla: 'ITA' },
  { id: 807, name: 'Poland', tla: 'POL' },
  { id: 827, name: 'Hungary', tla: 'HUN' },
  { id: 832, name: 'Chile', tla: 'CHI' },
  { id: 808, name: 'Russia', tla: 'RUS' },
  { id: 663, name: 'Serbia', tla: 'SRB' },
  { id: 782, name: 'Denmark', tla: 'DEN' },
  { id: 799, name: 'Nigeria', tla: 'NGA' },
  { id: 794, name: 'Cameroon', tla: 'CMR' },
  { id: 813, name: 'Costa Rica', tla: 'CRC' },
  { id: 767, name: 'Wales', tla: 'WAL' },
  { id: 1132, name: 'Northern Ireland', tla: 'NIR' },
  { id: 909, name: 'Republic of Ireland', tla: 'IRL' },
  { id: 798, name: 'Greece', tla: 'GRE' },
  { id: 791, name: 'Ukraine', tla: 'UKR' },
  { id: 811, name: 'Romania', tla: 'ROU' },
  { id: 817, name: 'Bulgaria', tla: 'BUL' },
  { id: 773, name: 'Slovakia', tla: 'SVK' },
  { id: 1092, name: 'Slovenia', tla: 'SVN' },
  { id: 769, name: 'Peru', tla: 'PER' },
]

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

function getFootballToken() {
  return (process.env.FOOTBALL_API_TOKEN || process.env.VITE_FOOTBALL_API_TOKEN || '').trim()
}

function resolveCrestUrl(crest, teamId) {
  if (crest?.trim()) {
    try {
      const url = new URL(crest.trim())
      if (url.hostname === 'crests.football-data.org') {
        return url.toString()
      }
    } catch {
      // fall through
    }
  }

  if (teamId != null) {
    return `https://crests.football-data.org/${teamId}.svg`
  }

  return null
}

function resolveFileName(team, crestUrl) {
  const extension = extname(new URL(crestUrl).pathname) || '.png'
  const tla = team.tla?.trim().toLowerCase()

  if (tla) {
    return `${tla}${extension}`
  }

  return `${team.id}${extension}`
}

async function downloadFile(url, destination) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  await pipeline(response.body, createWriteStream(destination))
}

async function downloadCrestForTeam(team) {
  const slug = team.name?.trim().toLowerCase().replace(/\s+/g, '')
  const candidates = [
    resolveCrestUrl(team.crest, team.id),
    team.id != null ? `https://crests.football-data.org/${team.id}.svg` : null,
    slug ? `https://crests.football-data.org/${slug}.svg` : null,
    team.id != null ? `https://crests.football-data.org/${team.id}.png` : null,
    slug ? `https://crests.football-data.org/${slug}.png` : null,
  ].filter(Boolean)

  for (const crestUrl of candidates) {
    const fileName = resolveFileName(team, crestUrl)
    const destination = resolve(outDir, fileName)

    try {
      await downloadFile(crestUrl, destination)
      return { fileName, crestUrl }
    } catch {
      // try next candidate
    }
  }

  throw new Error('nenhum formato de escudo disponível')
}

loadEnvFile()

const token = getFootballToken()

if (!token) {
  console.error(
    'FOOTBALL_API_TOKEN ou VITE_FOOTBALL_API_TOKEN é obrigatório para baixar os escudos.',
  )
  process.exit(1)
}

const response = await fetch(teamsApiUrl, {
  headers: { 'X-Auth-Token': token },
})

if (!response.ok) {
  const body = await response.text()
  console.error(`Falha ao buscar seleções (${response.status}): ${body}`)
  process.exit(1)
}

const body = await response.json()
const teams = [...(body.teams ?? [])]
const seenIds = new Set(teams.map((team) => team.id))

for (const extraTeam of EXTRA_HISTORICAL_TEAMS) {
  if (seenIds.has(extraTeam.id)) continue

  teams.push({
    id: extraTeam.id,
    name: extraTeam.name,
    shortName: extraTeam.name,
    tla: extraTeam.tla,
    crest: null,
  })
  seenIds.add(extraTeam.id)
}

mkdirSync(outDir, { recursive: true })
mkdirSync(dirname(srcCrestsFile), { recursive: true })

const index = []
let downloaded = 0
let skipped = 0
let failed = 0

for (const team of teams) {
  try {
    const { fileName, crestUrl } = await downloadCrestForTeam(team)
    downloaded += 1

    index.push({
      id: team.id,
      name: team.name,
      shortName: team.shortName ?? team.name,
      tla: team.tla,
      file: fileName,
      crestUrl,
    })

    console.log(`OK ${fileName} — ${team.name}`)
  } catch (error) {
    failed += 1
    console.warn(`Falha em ${team.name}: ${error instanceof Error ? error.message : error}`)
  }
}

index.sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '', 'pt-BR'))
const indexPayload = { updatedAt: new Date().toISOString(), teams: index }
writeFileSync(indexFile, `${JSON.stringify(indexPayload, null, 2)}\n`)
writeFileSync(srcCrestsFile, `${JSON.stringify(indexPayload, null, 2)}\n`)

console.log(
  `\nConcluído: ${downloaded} baixados, ${skipped} ignorados, ${failed} falhas em public/teams/`,
)
