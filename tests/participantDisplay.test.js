import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatPersonNameForStorage } from '../shared/personNameFormat.js'

describe('formatPersonNameKeyDisplay', () => {
  it('title-cases normalized participant keys', () => {
    assert.equal(formatPersonNameForStorage('matheus gavioli'), 'Matheus Gavioli')
    assert.equal(formatPersonNameForStorage('marcelo santana'), 'Marcelo Santana')
    assert.equal(formatPersonNameForStorage('robert la paz'), 'Robert la Paz')
  })
})
