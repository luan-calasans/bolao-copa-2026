const ALLOWED_PATH_PATTERNS = [
  /^competitions\/?$/,
  /^competitions\/WC\/matches$/,
  /^competitions\/WC\/teams$/,
  /^competitions\/WC\/standings$/,
  /^matches\/\d+$/,
  /^teams\/\d+$/,
  /^teams\/\d+\/matches$/,
]

export function normalizeFootballApiPath(apiPath) {
  const pathOnly = (apiPath ?? '').split('?')[0].replace(/^\/+|\/+$/g, '')
  return pathOnly
}

export function isAllowedFootballPath(apiPath) {
  const pathOnly = normalizeFootballApiPath(apiPath)
  if (!pathOnly) return false

  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(pathOnly))
}

const ALLOWED_CREST_PATH_PATTERN = /^[\w-]+\.(png|svg|webp)$/i

export function isAllowedCrestPath(apiPath) {
  const pathOnly = (apiPath ?? '').split('?')[0].replace(/^\/+|\/+$/g, '')
  if (!pathOnly) return false

  return ALLOWED_CREST_PATH_PATTERN.test(pathOnly)
}
