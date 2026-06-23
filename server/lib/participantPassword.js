import crypto from 'node:crypto'

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LEN = 64
const SALT_LEN = 16

export function hashParticipantPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN)
  const hash = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS)

  return `scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}`
}

export function verifyParticipantPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false
  }

  const parts = storedHash.split(':')

  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false
  }

  try {
    const salt = Buffer.from(parts[1], 'base64url')
    const expectedHash = Buffer.from(parts[2], 'base64url')
    const actualHash = crypto.scryptSync(password, salt, expectedHash.length, SCRYPT_PARAMS)

    return crypto.timingSafeEqual(actualHash, expectedHash)
  } catch {
    return false
  }
}
