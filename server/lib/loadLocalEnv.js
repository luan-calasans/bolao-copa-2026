import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_FILES = ['.env', '.env.development', '.env.development.local', '.env.local']

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const separator = trimmed.indexOf('=')
  if (separator === -1) return null

  const key = trimmed.slice(0, separator).trim()
  let value = trimmed.slice(separator + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

function parseEnvFile(content) {
  const result = {}

  for (const line of content.split('\n')) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    result[parsed.key] = parsed.value
  }

  return result
}

export function loadLocalEnv() {
  const root = process.cwd()

  for (const file of ENV_FILES) {
    const filePath = resolve(root, file)
    if (!existsSync(filePath)) continue

    const vars = parseEnvFile(readFileSync(filePath, 'utf8'))

    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        process.env[key] = value
      }
    }
  }
}

export function getPostgresConnectionString() {
  loadLocalEnv()

  const candidates = [
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL_UNPOOLED',
    'NEON_DATABASE_URL',
  ]

  for (const key of candidates) {
    const value = process.env[key]?.trim()
    if (value) return value
  }

  return null
}
