import { EventEmitter } from 'node:events'

export function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    end(payload = '') {
      this.body = payload
    },
  }

  return res
}

export function createJsonRequest({
  method = 'GET',
  url = '/api/bets',
  headers = {},
  body = null,
}) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = headers
  req.socket = { remoteAddress: '127.0.0.1' }
  req._body = body
  return req
}

export function parseJsonResponse(res) {
  return res.body ? JSON.parse(res.body) : null
}

export async function invokeBetsHandler(handleBetsRequest, options) {
  const req = createJsonRequest(options)
  const res = createMockResponse()
  const handlerPromise = handleBetsRequest(req, res)

  if (req._body != null) {
    await new Promise((resolve) => setImmediate(resolve))
    req.emit('data', Buffer.from(JSON.stringify(req._body), 'utf8'))
    req.emit('end')
  }

  await handlerPromise
  return res
}
