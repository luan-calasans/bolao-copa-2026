import { describe, expect, it } from 'vitest'
import { formatBetResultPoints, getBetResultStatus } from './betResult'

describe('betResult', () => {
  it('marks unfinished matches as pending', () => {
    const match = {
      status: 'scheduled' as const,
      score: { home: null, away: null },
    }

    expect(getBetResultStatus(match as never, 1, 0)).toBe('pending')
  })

  it('formats points for finished bets and keeps pending label', () => {
    expect(formatBetResultPoints('exact', 10)).toBe('10 pts')
    expect(formatBetResultPoints('partial', 3)).toBe('3 pts')
    expect(formatBetResultPoints('none', 0)).toBe('0 pts')
    expect(formatBetResultPoints('pending', null)).toBe('Aguardando')
  })

  it('classifies finished matches using shared scoring rules', () => {
    const match = {
      status: 'finished' as const,
      score: { home: 2, away: 1 },
    }

    expect(getBetResultStatus(match as never, 2, 1)).toBe('exact')
    expect(getBetResultStatus(match as never, 3, 0)).toBe('partial')
    expect(getBetResultStatus(match as never, 0, 0)).toBe('none')
  })
})
