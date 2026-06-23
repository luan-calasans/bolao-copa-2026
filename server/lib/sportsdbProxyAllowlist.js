const ALLOWED_ENDPOINTS = new Set([
  'searchevents.php',
  'searchfilename.php',
  'lookuptimeline.php',
  'lookupevent.php',
  'lookupeventstats.php',
  'lookuplineup.php',
  'eventsday.php',
  'eventshighlights.php',
])

export function normalizeSportsdbEndpoint(endpoint) {
  const pathOnly = (endpoint ?? '').split('?')[0].replace(/^\/+|\/+$/g, '')
  return pathOnly
}

export function isAllowedSportsdbEndpoint(endpoint) {
  const pathOnly = normalizeSportsdbEndpoint(endpoint)
  if (!pathOnly) return false

  return ALLOWED_ENDPOINTS.has(pathOnly)
}
