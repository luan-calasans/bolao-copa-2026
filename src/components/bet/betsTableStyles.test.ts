import { describe, expect, it } from 'vitest'
import { getBetResultPointsClass, resultClasses } from './betsTableStyles'

describe('getBetResultPointsClass', () => {
  it('maps point totals to the expected badge styles', () => {
    expect(getBetResultPointsClass(2, 'partial')).toBe(resultClasses.winner)
    expect(getBetResultPointsClass(3, 'partial')).toBe(resultClasses.partial)
    expect(getBetResultPointsClass(5, 'partial')).toBe(resultClasses.combo)
    expect(getBetResultPointsClass(0, 'none')).toBe(resultClasses.none)
    expect(getBetResultPointsClass(10, 'exact')).toBe(resultClasses.exact)
    expect(getBetResultPointsClass(12, 'exact')).toBe(resultClasses.exactCombo)
    expect(getBetResultPointsClass(null, 'pending')).toBe(resultClasses.pending)
  })
})
