import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  clearSchemaBootstrapOverride,
  ensureSchemaReady,
  resetSchemaBootstrap,
  setSchemaBootstrapOverride,
} from '../server/lib/schemaBootstrap.js'

describe('schemaBootstrap', () => {
  afterEach(() => {
    clearSchemaBootstrapOverride()
    resetSchemaBootstrap()
  })

  it('runs schema setup only once for concurrent callers', async () => {
    let bootstrapRuns = 0

    setSchemaBootstrapOverride(async () => {
      bootstrapRuns += 1
      await new Promise((resolve) => setTimeout(resolve, 25))
    })

    await Promise.all([ensureSchemaReady({}), ensureSchemaReady({}), ensureSchemaReady({})])

    assert.equal(bootstrapRuns, 1)
  })

  it('allows retry after a failed bootstrap', async () => {
    let bootstrapRuns = 0

    setSchemaBootstrapOverride(async () => {
      bootstrapRuns += 1

      if (bootstrapRuns === 1) {
        throw new Error('bootstrap failed')
      }
    })

    await assert.rejects(() => ensureSchemaReady({}), /bootstrap failed/)
    await assert.doesNotReject(() => ensureSchemaReady({}))
    assert.equal(bootstrapRuns, 2)
  })
})
