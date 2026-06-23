import { loadLocalEnv } from './loadLocalEnv.js'

export function getGeminiApiKey() {
  loadLocalEnv()

  return (
    (process.env.GEMINI_API_KEY || '').trim() ||
    (process.env.GOOGLE_API_KEY || '').trim()
  )
}

export function getGeminiModel() {
  loadLocalEnv()

  return (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim()
}

export function getGeminiFallbackModels() {
  return ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']
}

export function getGeminiModelsToTry() {
  const configured = getGeminiModel()
  const fallbacks = getGeminiFallbackModels().filter((model) => model !== configured)
  return [configured, ...fallbacks]
}
