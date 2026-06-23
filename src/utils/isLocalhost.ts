export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false

  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

export function isSingleAiRequestPerPage(): boolean {
  return !isLocalhost()
}
