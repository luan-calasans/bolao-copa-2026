import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isFootballConfigError,
  isInternalErrorMessage,
  isPostgresConfigError,
} from '../server/lib/userFacingErrors.js'

describe('userFacingErrors', () => {
  it('flags technical messages', () => {
    assert.equal(isInternalErrorMessage('FOOTBALL_API_TOKEN não configurado'), true)
    assert.equal(isInternalErrorMessage('Defina BOLAO_ACCESS_TOKEN na Vercel'), true)
    assert.equal(isInternalErrorMessage('Jogo não encontrado.'), false)
    assert.equal(isInternalErrorMessage('Muitas consultas ao ranking.'), false)
  })

  it('detects config errors from thrown messages', () => {
    assert.equal(isPostgresConfigError(new Error('POSTGRES_URL não configurado')), true)
    assert.equal(isFootballConfigError(new Error('FOOTBALL_API_TOKEN não configurado')), true)
    assert.equal(isPostgresConfigError(new Error('timeout')), false)
  })
})
