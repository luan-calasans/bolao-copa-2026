import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizePersonNameKey } from '../shared/participantKey.js'

describe('normalizePersonNameKey', () => {
  it('treats accented and unaccented names as the same key', () => {
    assert.equal(normalizePersonNameKey('João'), 'joao')
    assert.equal(normalizePersonNameKey('Joao'), 'joao')
    assert.equal(normalizePersonNameKey('JOSÉ'), 'jose')
    assert.equal(normalizePersonNameKey('jose'), 'jose')
  })

  it('normalizes casing and surrounding whitespace', () => {
    assert.equal(normalizePersonNameKey('Maria'), 'maria')
    assert.equal(normalizePersonNameKey('  Maria  '), 'maria')
    assert.equal(normalizePersonNameKey('MARIA'), 'maria')
  })

  it('collapses internal whitespace', () => {
    assert.equal(normalizePersonNameKey('Maria   Silva'), 'maria silva')
    assert.equal(normalizePersonNameKey('  Maria   Silva  '), 'maria silva')
  })

  it('returns empty string for missing or blank names', () => {
    assert.equal(normalizePersonNameKey(''), '')
    assert.equal(normalizePersonNameKey('   '), '')
    assert.equal(normalizePersonNameKey(null), '')
    assert.equal(normalizePersonNameKey(undefined), '')
  })
})
