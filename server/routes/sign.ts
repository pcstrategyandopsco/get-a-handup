// ZERO KNOWLEDGE: receives document object, returns ECDSA signature, persists nothing.
// No logging of document contents. No session tracking. Stateless pipe only.

import { Hono } from 'hono'
import { signDocument } from '../lib/signing.js'

const sign = new Hono()

sign.post('/', async (c) => {
  let body: { document?: object }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  if (!body.document || typeof body.document !== 'object') {
    return c.json({ error: 'document field required' }, 400)
  }

  try {
    const result = signDocument(body.document)
    return c.json(result)
  } catch {
    return c.json({ error: 'Signing failed' }, 500)
  }
})

export default sign
