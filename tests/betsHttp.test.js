import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createSessionToken } from '../server/lib/adminAuth.js'
import { resetBetDbSqlProvider, setBetDbSqlProvider } from '../server/lib/betDb.js'
import { handleBetsRequest } from '../server/lib/betsHttp.js'
import {
  resetFetchMatchByIdOverride,
  setFetchMatchByIdOverride,
} from '../server/lib/footballApi.js'
import { clearRateLimit } from '../server/lib/rateLimit.js'
import { createInMemoryBetDb } from './helpers/inMemoryBetDb.js'
import { invokeBetsHandler, parseJsonResponse } from './helpers/mockHttp.js'

const RECEIPT_ID = '550e8400-e29b-41d4-a716-446655440000'
const OTHER_RECEIPT_ID = '660e8400-e29b-41d4-a716-446655440001'
const TIMESTAMP = '2026-06-15T12:00:00.000Z'
const MATCH_ID = 42
const CLIENT_IP = '127.0.0.1'
const TEST_ADMIN_PASSWORD = 'test-admin-password'
const TEST_SESSION_SECRET = 'test-session-secret'

const originalEnv = { ...process.env }

function buildAdminAuthHeaders() {
  const { token } = createSessionToken()
  return {
    cookie: `admin_session=${encodeURIComponent(token)}`,
  }
}

function buildApiMatch(overrides = {}) {
  return {
    id: MATCH_ID,
    status: 'SCHEDULED',
    utcDate: '2030-06-15T20:00:00.000Z',
    minute: null,
    venue: 'Arena',
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    homeTeam: {
      id: 1,
      name: 'Brasil',
      shortName: 'Brasil',
      tla: 'BRA',
      crest: 'https://crests.football-data.org/1.png',
    },
    awayTeam: {
      id: 2,
      name: 'Argentina',
      shortName: 'Argentina',
      tla: 'ARG',
      crest: 'https://crests.football-data.org/2.png',
    },
    score: { fullTime: { home: null, away: null } },
    ...overrides,
  }
}

function buildPostBody(overrides = {}) {
  const bet = {
    matchId: MATCH_ID,
    homeScore: 2,
    awayScore: 1,
    winnerPick: 'home',
    personName: 'João',
    createdAt: TIMESTAMP,
    ...overrides.bet,
  }

  return {
    receipt: {
      id: RECEIPT_ID,
      generatedAt: TIMESTAMP,
      ...overrides.receipt,
    },
    bet,
  }
}

function postBet(overrides = {}) {
  return invokeBetsHandler(handleBetsRequest, {
    method: 'POST',
    url: '/api/bets',
    headers: buildAdminAuthHeaders(),
    body: buildPostBody(overrides),
  })
}

describe('handleBetsRequest', () => {
  let store

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: TEST_SESSION_SECRET,
      PARTICIPANT_SESSION_SECRET: TEST_SESSION_SECRET,
    }
    delete process.env.BOLAO_ACCESS_TOKEN

    store = createInMemoryBetDb()
    setBetDbSqlProvider(() => store.sql)
    setFetchMatchByIdOverride(async (matchId) => {
      if (matchId === MATCH_ID) {
        return buildApiMatch()
      }
      return null
    })
  })

  afterEach(async () => {
    resetBetDbSqlProvider()
    resetFetchMatchByIdOverride()
    process.env = { ...originalEnv }
    await clearRateLimit(`bets-list:${CLIENT_IP}`)
  })

  it('creates a bet through POST and returns 201', async () => {
    const res = await postBet()

    assert.equal(res.statusCode, 201)
    assert.deepEqual(parseJsonResponse(res), { receiptId: RECEIPT_ID })
  })

  it('returns 200 on idempotent POST retry without calling football API again', async () => {
    let footballCalls = 0
    setFetchMatchByIdOverride(async (matchId) => {
      footballCalls += 1
      return matchId === MATCH_ID ? buildApiMatch() : null
    })

    await postBet()

    const retry = await postBet()

    assert.equal(retry.statusCode, 200)
    assert.equal(footballCalls, 1)
    assert.deepEqual(parseJsonResponse(retry), { receiptId: RECEIPT_ID })
  })

  it('rejects POST when football API reports a finished match', async () => {
    setFetchMatchByIdOverride(async () => buildApiMatch({ status: 'FINISHED' }))

    const res = await postBet()

    assert.equal(res.statusCode, 400)
    assert.match(parseJsonResponse(res).message, /encerrado/)
  })

  it('rejects POST without participant or admin session', async () => {
    const res = await invokeBetsHandler(handleBetsRequest, {
      method: 'POST',
      url: '/api/bets',
      body: buildPostBody(),
    })

    assert.equal(res.statusCode, 401)
    assert.equal(parseJsonResponse(res).code, 'PARTICIPANT_AUTH_REQUIRED')
  })

  it('rejects POST when trying to change an existing score', async () => {
    await postBet()

    const res = await postBet({
      receipt: { id: OTHER_RECEIPT_ID },
      bet: { homeScore: 3, awayScore: 1 },
    })

    assert.equal(res.statusCode, 400)
    assert.match(parseJsonResponse(res).message, /placar deste jogo/)
  })

  it('complements an existing score-only bet with winner pick', async () => {
    await postBet({
      bet: { winnerPick: null, homeScore: 2, awayScore: 1 },
    })

    const res = await postBet({
      receipt: { id: OTHER_RECEIPT_ID },
      bet: { winnerPick: 'home', homeScore: null, awayScore: null },
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(parseJsonResponse(res), { receiptId: RECEIPT_ID })

    const stored = await invokeBetsHandler(handleBetsRequest, {
      method: 'GET',
      url: `/api/bets?receiptId=${RECEIPT_ID}`,
    })

    const body = parseJsonResponse(stored)
    assert.equal(body.bet.winnerPick, 'home')
    assert.equal(body.bet.homeScore, 2)
    assert.equal(body.bet.awayScore, 1)
  })

  it('lists bets by match id without bolao access', async () => {
    await postBet()

    const res = await invokeBetsHandler(handleBetsRequest, {
      method: 'GET',
      url: `/api/bets?matchId=${MATCH_ID}`,
    })

    const body = parseJsonResponse(res)

    assert.equal(res.statusCode, 200)
    assert.equal(body.matchId, MATCH_ID)
    assert.equal(body.bets.length, 1)
    assert.equal(body.bets[0].receiptId, RECEIPT_ID)
  })

  it('returns a stored receipt by id', async () => {
    await postBet()

    const res = await invokeBetsHandler(handleBetsRequest, {
      method: 'GET',
      url: `/api/bets?receiptId=${RECEIPT_ID}`,
    })

    const body = parseJsonResponse(res)

    assert.equal(res.statusCode, 200)
    assert.equal(body.id, RECEIPT_ID)
    assert.equal(body.bet.matchId, MATCH_ID)
    assert.equal(body.bet.personName, 'João')
    assert.equal(body.bet.match.status, 'scheduled')
  })

  it('lists all bets on GET /api/bets', async () => {
    await postBet()

    const res = await invokeBetsHandler(handleBetsRequest, {
      method: 'GET',
      url: '/api/bets',
    })

    const body = parseJsonResponse(res)

    assert.equal(res.statusCode, 200)
    assert.equal(body.bets.length, 1)
    assert.equal(body.bets[0].receiptId, RECEIPT_ID)
  })

  it('blocks DELETE on the public bets endpoint', async () => {
    const res = await invokeBetsHandler(handleBetsRequest, {
      method: 'DELETE',
      url: `/api/bets?receiptId=${RECEIPT_ID}`,
    })

    assert.equal(res.statusCode, 403)
    assert.match(parseJsonResponse(res).message, /administrativa/)
  })
})
