import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  computeHitRateEfficiency,
  formatEfficiencyPercent,
} from '../shared/betEfficiency.js'

describe('betEfficiency', () => {
  it('computes hit rate from decided games only', () => {
    assert.equal(computeHitRateEfficiency(3, 5, 2), 80)
    assert.equal(computeHitRateEfficiency(0, 0, 0), null)
    assert.equal(computeHitRateEfficiency(2, 0, 0), 100)
    assert.equal(computeHitRateEfficiency(0, 0, 4), 0)
  })

  it('formats efficiency percent for display', () => {
    assert.equal(formatEfficiencyPercent(80), '80%')
    assert.equal(formatEfficiencyPercent(37.5), '37.5%')
    assert.equal(formatEfficiencyPercent(null), '—')
  })
})
