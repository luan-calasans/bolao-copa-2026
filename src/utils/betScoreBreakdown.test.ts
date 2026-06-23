import { describe, expect, it } from 'vitest'
import { buildBetScoreBreakdown } from './betScoreBreakdown'

const finishedMatch = {
  status: 'finished' as const,
  score: { home: 2, away: 1 },
  homeTeam: { id: 1, name: 'Brasil', shortName: 'BRA', tla: 'BRA', crest: '', isDefined: true },
  awayTeam: { id: 2, name: 'Argentina', shortName: 'ARG', tla: 'ARG', crest: '', isDefined: true },
}

describe('buildBetScoreBreakdown', () => {
  it('lists each scoring criterion that was hit', () => {
    const breakdown = buildBetScoreBreakdown(finishedMatch, 2, 1, 'home')

    expect(breakdown.isPending).toBe(false)
    expect(breakdown.totalPoints).toBe(12)
    expect(breakdown.hits).toEqual([
      expect.objectContaining({ title: 'Placar exato', points: 10, tone: 'exact' }),
      expect.objectContaining({ title: 'Quem vence?', points: 2, tone: 'winner' }),
    ])
  })

  it('describes partial and winner hits separately', () => {
    const breakdown = buildBetScoreBreakdown(finishedMatch, 3, 0, 'home')

    expect(breakdown.totalPoints).toBe(5)
    expect(breakdown.hits).toEqual([
      expect.objectContaining({
        title: 'Acerto parcial',
        points: 3,
        tone: 'partial',
        description: expect.stringMatching(/diferença de até 3 gols/),
      }),
      expect.objectContaining({ title: 'Quem vence?', points: 2, tone: 'winner' }),
    ])
  })

  it('returns pending breakdown for unfinished matches', () => {
    const breakdown = buildBetScoreBreakdown(
      { ...finishedMatch, status: 'scheduled' },
      2,
      1,
      'home',
    )

    expect(breakdown.isPending).toBe(true)
    expect(breakdown.hits).toHaveLength(0)
  })

  it('returns no hits when no criteria were met', () => {
    const breakdown = buildBetScoreBreakdown(finishedMatch, 0, 0, 'away')

    expect(breakdown.totalPoints).toBe(0)
    expect(breakdown.hits).toHaveLength(0)
  })
})
