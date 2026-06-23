import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  assertBetMatchesExisting,
  findReceiptById,
  insertBetAndReceipt,
  resetBetDbSqlProvider,
  setBetDbSqlProvider,
} from '../server/lib/betDb.js'
import { ValidationError } from '../server/lib/validateInput.js'
import { createInMemoryBetDb } from './helpers/inMemoryBetDb.js'

const RECEIPT_ID = '550e8400-e29b-41d4-a716-446655440000'
const TIMESTAMP = '2026-06-15T12:00:00.000Z'

function buildBet(overrides = {}) {
  return {
    matchId: 42,
    homeScore: 2,
    awayScore: 1,
    winnerPick: 'home',
    personName: 'João',
    match: { id: 42, status: 'scheduled' },
    createdAt: TIMESTAMP,
    ...overrides,
  }
}

function buildReceipt(overrides = {}) {
  return {
    id: RECEIPT_ID,
    generatedAt: TIMESTAMP,
    ...overrides,
  }
}

describe('assertBetMatchesExisting', () => {
  it('allows identical bet payloads', () => {
    const bet = buildBet()
    assert.doesNotThrow(() => assertBetMatchesExisting(bet, bet))
  })

  it('rejects receipt reuse with different scores', () => {
    assert.throws(
      () => assertBetMatchesExisting(buildBet(), buildBet({ homeScore: 3 })),
      ValidationError,
    )
  })
})

describe('insertBetAndReceipt', () => {
  afterEach(() => {
    resetBetDbSqlProvider()
  })

  it('inserts a new receipt and bet', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    const result = await insertBetAndReceipt(buildReceipt(), buildBet())

    assert.equal(result.receiptId, RECEIPT_ID)
    assert.equal(result.created, true)
  })

  it('returns existing receipt on idempotent retry', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    const receipt = buildReceipt()
    const bet = buildBet()

    await insertBetAndReceipt(receipt, bet)
    const retry = await insertBetAndReceipt(receipt, bet)

    assert.equal(retry.receiptId, RECEIPT_ID)
    assert.equal(retry.created, false)
  })

  it('rejects idempotent retry when bet payload changed', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    await insertBetAndReceipt(buildReceipt(), buildBet())

    await assert.rejects(
      () => insertBetAndReceipt(buildReceipt(), buildBet({ homeScore: 3 })),
      (error) => {
        assert.equal(error instanceof ValidationError, true)
        assert.match(error.message, /dados diferentes/)
        return true
      },
    )
  })

  it('completes orphan receipt by inserting only the bet row', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    store.seedReceipt(RECEIPT_ID, { generatedAt: TIMESTAMP })

    const result = await insertBetAndReceipt(buildReceipt(), buildBet())

    assert.equal(result.receiptId, RECEIPT_ID)
    assert.equal(result.created, true)
  })

  it('rejects duplicate person per match', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    await insertBetAndReceipt(buildReceipt(), buildBet())

    await assert.rejects(
      () =>
        insertBetAndReceipt(
          buildReceipt({ id: '660e8400-e29b-41d4-a716-446655440001' }),
          buildBet({ homeScore: 3 }),
        ),
      (error) => {
        assert.equal(error instanceof ValidationError, true)
        assert.match(error.message, /placar deste jogo/)
        return true
      },
    )
  })

  it('complements an existing score-only bet with winner pick', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    await insertBetAndReceipt(
      buildReceipt(),
      buildBet({ winnerPick: undefined, homeScore: 2, awayScore: 1 }),
    )

    const result = await insertBetAndReceipt(
      buildReceipt({ id: '660e8400-e29b-41d4-a716-446655440001' }),
      buildBet({ winnerPick: 'home', homeScore: null, awayScore: null }),
    )

    assert.equal(result.receiptId, RECEIPT_ID)
    assert.equal(result.complemented, true)

    const stored = await findReceiptById(RECEIPT_ID)
    assert.equal(stored?.bet.winnerPick, 'home')
    assert.equal(stored?.bet.homeScore, 2)
    assert.equal(stored?.bet.awayScore, 1)
    assert.ok(stored?.bet.updatedAt)
  })

  it('rejects reuse of deleted receipt', async () => {
    const store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)

    store.seedReceipt(RECEIPT_ID, {
      generatedAt: TIMESTAMP,
      deletedAt: TIMESTAMP,
    })

    await assert.rejects(
      () => insertBetAndReceipt(buildReceipt(), buildBet()),
      (error) => {
        assert.equal(error instanceof ValidationError, true)
        assert.match(error.message, /removido/)
        return true
      },
    )
  })
})
