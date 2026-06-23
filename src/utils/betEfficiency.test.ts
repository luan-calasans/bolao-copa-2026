import { describe, expect, it } from 'vitest'
import { computeHitRateEfficiency, formatEfficiencyPercent } from './betEfficiency'

describe('betEfficiency', () => {
  it('computes hit rate from decided games only', () => {
    expect(computeHitRateEfficiency(3, 5, 2)).toBe(80)
    expect(computeHitRateEfficiency(0, 0, 0)).toBeNull()
  })

  it('formats efficiency percent for display', () => {
    expect(formatEfficiencyPercent(80)).toBe('80%')
    expect(formatEfficiencyPercent(null)).toBe('—')
  })
})
