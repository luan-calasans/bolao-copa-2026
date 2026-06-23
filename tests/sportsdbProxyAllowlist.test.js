import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedSportsdbEndpoint, normalizeSportsdbEndpoint } from '../server/lib/sportsdbProxyAllowlist.js'

describe('sportsdbProxyAllowlist', () => {
  it('allows timeline, stats, lineup and search endpoints', () => {
    assert.equal(isAllowedSportsdbEndpoint('lookuptimeline.php'), true)
    assert.equal(isAllowedSportsdbEndpoint('lookupeventstats.php'), true)
    assert.equal(isAllowedSportsdbEndpoint('lookuplineup.php'), true)
    assert.equal(isAllowedSportsdbEndpoint('searchevents.php'), true)
    assert.equal(isAllowedSportsdbEndpoint('eventsday.php'), true)
    assert.equal(isAllowedSportsdbEndpoint('eventshighlights.php'), true)
  })

  it('blocks unknown endpoints', () => {
    assert.equal(isAllowedSportsdbEndpoint('searchteams.php'), false)
    assert.equal(isAllowedSportsdbEndpoint('../secret.php'), false)
  })

  it('normalizes endpoint paths', () => {
    assert.equal(normalizeSportsdbEndpoint('/lookuptimeline.php'), 'lookuptimeline.php')
  })
})
