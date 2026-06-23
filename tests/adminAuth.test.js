import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  createSessionToken,
  isAdminAuthenticated,
  parseSessionPayload,
  verifyAdminPassword,
} from '../server/lib/adminAuth.js'
import { isAdminSessionRevoked, revokeAdminSession } from '../server/lib/adminSessionRevocation.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('adminAuth', () => {
  it('verifies admin password with timing-safe comparison', () => {
    process.env.ADMIN_PASSWORD = 'strong-password'
    process.env.ADMIN_SESSION_SECRET = 'session-secret'

    assert.equal(verifyAdminPassword('strong-password'), true)
    assert.equal(verifyAdminPassword('wrong-password'), false)
  })

  it('creates and validates session token with jti', async () => {
    process.env.ADMIN_PASSWORD = 'strong-password'
    process.env.ADMIN_SESSION_SECRET = 'session-secret'

    const { token } = createSessionToken()
    const payload = parseSessionPayload(token)

    assert.ok(payload)
    assert.ok(payload.jti)
    assert.ok(payload.exp > Math.floor(Date.now() / 1000))

    const req = {
      headers: {
        cookie: `admin_session=${encodeURIComponent(token)}`,
      },
    }

    assert.equal(await isAdminAuthenticated(req), true)

    await revokeAdminSession(payload.jti, payload.exp)
    assert.equal(await isAdminSessionRevoked(payload.jti), true)
    assert.equal(await isAdminAuthenticated(req), false)
  })
})
