import { ValidationError } from './validateInput.js'

export function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.end(JSON.stringify(body))
}

export function readJsonBody(req, maxBytes = 65_536) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let totalBytes = 0

    req.on('data', (chunk) => {
      totalBytes += chunk.length

      if (totalBytes > maxBytes) {
        reject(new ValidationError('Payload muito grande.'))
        req.destroy()
        return
      }

      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new ValidationError('JSON inválido.'))
      }
    })

    req.on('error', reject)
  })
}

export function sendTooManyRequests(res, message, retryAfterSeconds) {
  res.setHeader('Retry-After', String(retryAfterSeconds))
  sendJson(res, 429, { message, retryAfterSeconds })
}
