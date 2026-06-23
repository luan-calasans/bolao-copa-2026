import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { getFootballToken } from '../server/lib/footballToken.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('footballToken', () => {
  it('prefers server token in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.FOOTBALL_API_TOKEN = 'server-token'
    process.env.VITE_FOOTBALL_API_TOKEN = 'client-token'

    assert.equal(getFootballToken(), 'server-token')
  })

  it('does not use vite token in production when server token is missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.FOOTBALL_API_TOKEN
    process.env.VITE_FOOTBALL_API_TOKEN = 'client-token'

    assert.equal(getFootballToken(), '')
  })

  it('falls back to vite token in development', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.FOOTBALL_API_TOKEN
    process.env.VITE_FOOTBALL_API_TOKEN = 'client-token'

    assert.equal(getFootballToken(), 'client-token')
  })
})
