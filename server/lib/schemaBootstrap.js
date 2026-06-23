import { ensureSchemaStructure } from './ensureSchema.js'

/** @type {Promise<void> | null} */
let schemaReadyPromise = null

/** @type {((sql: unknown) => Promise<void>) | null} */
let bootstrapOverride = null

export function resetSchemaBootstrap() {
  schemaReadyPromise = null
}

export function setSchemaBootstrapOverride(fn) {
  bootstrapOverride = fn
  resetSchemaBootstrap()
}

export function clearSchemaBootstrapOverride() {
  bootstrapOverride = null
  resetSchemaBootstrap()
}

export async function ensureSchemaReady(sql) {
  const bootstrap = bootstrapOverride ?? ensureSchemaStructure

  if (!schemaReadyPromise) {
    schemaReadyPromise = bootstrap(sql).catch((error) => {
      schemaReadyPromise = null
      throw error
    })
  }

  return schemaReadyPromise
}
