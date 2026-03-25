// ZERO KNOWLEDGE: writes two anonymous fields + week number only.
// No user ID, no session ID, no personal data, no precise timestamp.

import { Hono } from 'hono'
import { recordOutcome } from '../db/index.js'

const VALID_OUTCOME_CODES = new Set([
  'GRANTED',
  'DENIED',
  'NOT_ASSESSED',
  'DEFERRED',
  'DEFLECTED'
])

const outcome = new Hono()

outcome.post('/', async (c) => {
  let body: { entitlement_type?: string; outcome_code?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const { entitlement_type, outcome_code } = body

  if (!entitlement_type || typeof entitlement_type !== 'string') {
    return c.json({ error: 'entitlement_type required' }, 400)
  }

  if (!outcome_code || !VALID_OUTCOME_CODES.has(outcome_code)) {
    return c.json({
      error: `outcome_code must be one of: ${[...VALID_OUTCOME_CODES].join(', ')}`
    }, 400)
  }

  try {
    recordOutcome(entitlement_type.slice(0, 100), outcome_code)
    return c.json({ ok: true })
  } catch (err) {
    console.error('Outcome write error:', err)
    return c.json({ error: 'Failed to record outcome' }, 500)
  }
})

export default outcome
