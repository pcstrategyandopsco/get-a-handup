// Flat-file outcome store. Append-only, one JSON line per outcome.
// No SQLite, no ORM, no native dependencies.

import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import { currentWeek } from '../lib/signing.js'

const logPath = process.env.OUTCOME_LOG ?? './data/outcomes.jsonl'

// Ensure data directory exists
try {
  mkdirSync(dirname(logPath), { recursive: true })
} catch {}

export function recordOutcome(entitlement_type: string, outcome_code: string): void {
  const line = JSON.stringify({
    entitlement_type,
    outcome_code,
    week: currentWeek()
  })
  appendFileSync(logPath, line + '\n')
}

export function runMigrations(): void {
  if (!existsSync(logPath)) {
    appendFileSync(logPath, '')
  }
  console.log('// Outcome log ready:', logPath)
}
