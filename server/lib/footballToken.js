import { isProduction } from './env.js'

export function getFootballToken() {
  const serverToken = (process.env.FOOTBALL_API_TOKEN || '').trim()

  if (serverToken) {
    return serverToken
  }

  if (!isProduction()) {
    return (process.env.VITE_FOOTBALL_API_TOKEN || '').trim()
  }

  return ''
}
