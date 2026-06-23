import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatPersonNameForStorage } from '../shared/personNameFormat.js'

describe('formatPersonNameForStorage', () => {
  it('formats names with title case and lowercase particles', () => {
    assert.equal(
      formatPersonNameForStorage('luan de souza campos calasans'),
      'Luan de Souza Campos Calasans',
    )
    assert.equal(
      formatPersonNameForStorage('ederson calasans dos santos'),
      'Ederson Calasans dos Santos',
    )
    assert.equal(formatPersonNameForStorage('jimmy di david'), 'Jimmy di David')
    assert.equal(formatPersonNameForStorage('robert la paz'), 'Robert la Paz')
  })

  it('normalizes mixed casing input', () => {
    assert.equal(formatPersonNameForStorage('ROBERTO LA PAZ'), 'Roberto la Paz')
    assert.equal(formatPersonNameForStorage('rOBerto DA Paz'), 'Roberto da Paz')
    assert.equal(formatPersonNameForStorage('  LUAN   DE   SOUZA  '), 'Luan de Souza')
  })

  it('keeps the first word capitalized even when it is a particle', () => {
    assert.equal(formatPersonNameForStorage('de souza'), 'De Souza')
  })
})
