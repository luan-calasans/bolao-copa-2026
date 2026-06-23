import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import {
  clampBetScore,
  getMinBetScores,
  validateBetContent,
  validateBetScores,
  validatePersonName,
} from './betValidation'

function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    utcDate: '2030-06-15T20:00:00.000Z',
    status: 'scheduled',
    rawStatus: 'SCHEDULED',
    minute: null,
    venue: null,
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    homeTeam: {
      id: 1,
      name: 'Brasil',
      shortName: 'Brasil',
      tla: 'BRA',
      crest: '',
      isDefined: true,
    },
    awayTeam: {
      id: 2,
      name: 'Argentina',
      shortName: 'Argentina',
      tla: 'ARG',
      crest: '',
      isDefined: true,
    },
    score: { home: null, away: null },
    halfTimeScore: { home: null, away: null },
    isLive: false,
    ...overrides,
  }
}

describe('validatePersonName', () => {
  it('rejects empty and too-short names', () => {
    expect(validatePersonName('')).toBe('Informe seu nome no bolão.')
    expect(validatePersonName('A')).toBe('O nome deve ter pelo menos 2 caracteres.')
  })

  it('rejects names longer than 80 characters', () => {
    expect(validatePersonName('A'.repeat(81))).toBe('O nome deve ter no máximo 80 caracteres.')
  })

  it('rejects control characters', () => {
    expect(validatePersonName('Jo\u0007ao')).toBe('Nome inválido.')
  })

  it('rejects names with digits', () => {
    expect(validatePersonName('João3')).toBe('Não é permitido usar números no nome.')
  })

  it('accepts valid names', () => {
    expect(validatePersonName('João')).toBeNull()
  })
})

describe('validateBetContent', () => {
  it('requires at least winner or score', () => {
    expect(validateBetContent(null, null, null)).toMatch(/Informe quem vence/)
    expect(validateBetContent('home', null, null)).toBeNull()
    expect(validateBetContent(null, 2, 1)).toBeNull()
  })
})

describe('validateBetScores', () => {
  it('requires live minimum scores', () => {
    const match = buildMatch({
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      score: { home: 2, away: 1 },
    })

    expect(validateBetScores(match, 1, 1)).toContain('mandante já marcou 2')
  })

  it('clamps scores to the configured maximum', () => {
    expect(clampBetScore(25, 0)).toBe(20)
    expect(getMinBetScores(buildMatch({ isLive: true, score: { home: 1, away: 0 } }))).toEqual({
      home: 1,
      away: 0,
    })
  })
})
