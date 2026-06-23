export const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json'

export function getSportsdbApiKey() {
  return (process.env.THESPORTSDB_API_KEY || '123').trim()
}
