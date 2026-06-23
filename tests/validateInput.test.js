import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ValidationError,
  assertSafeMatchId,
  assertSafeReceiptId,
  assertSafeTeamId,
  parseBetPayload,
  parseChampionBetPayload,
} from '../server/lib/validateInput.js'

describe('validateInput', () => {
  it('validates receipt id as uuid', () => {
    assert.equal(
      assertSafeReceiptId('550e8400-e29b-41d4-a716-446655440000'),
      '550e8400-e29b-41d4-a716-446655440000',
    )
  })

  it('rejects invalid receipt id', () => {
    assert.throws(() => assertSafeReceiptId('not-valid'), ValidationError)
  })

  it('validates match id range', () => {
    assert.equal(assertSafeMatchId('42'), 42)
    assert.throws(() => assertSafeMatchId('0'), ValidationError)
  })

  it('validates team id range', () => {
    assert.equal(assertSafeTeamId('57'), 57)
    assert.throws(() => assertSafeTeamId('0'), ValidationError)
  })

  it('parses champion bet payload', () => {
    const parsed = parseChampionBetPayload({
      receipt: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        generatedAt: '2026-06-15T12:00:00.000Z',
      },
      bet: {
        teamId: 57,
        personName: 'João',
        createdAt: '2026-06-15T12:00:00.000Z',
      },
    })

    assert.equal(parsed.bet.teamId, 57)
    assert.equal(parsed.bet.personName, 'João')
  })

  it('rejects champion bet payload missing team id', () => {
    assert.throws(
      () =>
        parseChampionBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            personName: 'João',
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      ValidationError,
    )
  })

  it('parses bet payload without match snapshot', () => {
    const parsed = parseBetPayload({
      receipt: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        generatedAt: '2026-06-15T12:00:00.000Z',
      },
      bet: {
        matchId: 10,
        homeScore: 2,
        awayScore: 1,
        winnerPick: 'home',
        personName: 'João',
        createdAt: '2026-06-15T12:00:00.000Z',
      },
    })

    assert.equal(parsed.bet.matchId, 10)
    assert.equal(parsed.bet.personName, 'João')
    assert.equal(parsed.bet.winnerPick, 'home')
    assert.equal('match' in parsed.bet, false)
  })

  it('rejects payload missing person name', () => {
    assert.throws(
      () =>
        parseBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            matchId: 10,
            homeScore: 2,
            awayScore: 1,
            winnerPick: 'home',
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      ValidationError,
    )
  })

  it('rejects person name shorter than 2 characters', () => {
    assert.throws(
      () =>
        parseBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            matchId: 10,
            homeScore: 2,
            awayScore: 1,
            winnerPick: 'home',
            personName: 'A',
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      /pelo menos 2 caracteres/,
    )
  })

  it('rejects person name longer than 80 characters', () => {
    assert.throws(
      () =>
        parseBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            matchId: 10,
            homeScore: 2,
            awayScore: 1,
            winnerPick: 'home',
            personName: 'A'.repeat(81),
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      /no máximo 80 caracteres/,
    )
  })

  it('rejects person name with control characters', () => {
    assert.throws(
      () =>
        parseBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            matchId: 10,
            homeScore: 2,
            awayScore: 1,
            winnerPick: 'home',
            personName: 'Jo\u0007ao',
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      /Nome inválido/,
    )
  })

  it('accepts payload with only winner pick', () => {
    const parsed = parseBetPayload({
      receipt: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        generatedAt: '2026-06-15T12:00:00.000Z',
      },
      bet: {
        matchId: 10,
        homeScore: null,
        awayScore: null,
        winnerPick: 'home',
        personName: 'João',
        createdAt: '2026-06-15T12:00:00.000Z',
      },
    })

    assert.equal(parsed.bet.winnerPick, 'home')
    assert.equal(parsed.bet.homeScore, null)
    assert.equal(parsed.bet.awayScore, null)
  })

  it('accepts payload with only score pick', () => {
    const parsed = parseBetPayload({
      receipt: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        generatedAt: '2026-06-15T12:00:00.000Z',
      },
      bet: {
        matchId: 10,
        homeScore: 2,
        awayScore: 1,
        personName: 'João',
        createdAt: '2026-06-15T12:00:00.000Z',
      },
    })

    assert.equal(parsed.bet.winnerPick, null)
    assert.equal(parsed.bet.homeScore, 2)
  })

  it('rejects payload missing winner pick and score', () => {
    assert.throws(
      () =>
        parseBetPayload({
          receipt: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            generatedAt: '2026-06-15T12:00:00.000Z',
          },
          bet: {
            matchId: 10,
            homeScore: null,
            awayScore: null,
            personName: 'João',
            createdAt: '2026-06-15T12:00:00.000Z',
          },
        }),
      /Informe quem vence, o placar previsto ou ambos/,
    )
  })
})
