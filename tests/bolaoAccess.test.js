import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  isBolaoAccessAuthorized,
  isBolaoAccessConfigured,
  isBolaoAccessRequired,
} from '../server/lib/bolaoAccess.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

function mockReq(token) {
  return {
    headers: token ? { 'x-bolao-token': token } : {},
  }
}

describe('bolaoAccess', () => {
  it('requires token in production when configured', () => {
    process.env.NODE_ENV = 'production'
    process.env.BOLAO_ACCESS_TOKEN = 'secret-token'

    assert.equal(isBolaoAccessRequired(), true)
    assert.equal(isBolaoAccessConfigured(), true)
    assert.equal(isBolaoAccessAuthorized(mockReq('secret-token')), true)
    assert.equal(isBolaoAccessAuthorized(mockReq('wrong')), false)
    assert.equal(isBolaoAccessAuthorized(mockReq()), false)
  })

  it('fails closed in production without configured token', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.BOLAO_ACCESS_TOKEN

    assert.equal(isBolaoAccessAuthorized(mockReq()), false)
  })

  it('allows open access in development without token', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.BOLAO_ACCESS_TOKEN

    assert.equal(isBolaoAccessRequired(), false)
    assert.equal(isBolaoAccessAuthorized(mockReq()), true)
  })
})
