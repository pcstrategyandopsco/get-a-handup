// ZERO KNOWLEDGE: this table holds no personal data whatsoever.
// Three fields: what entitlement was raised, what happened, which week.
// No user ID. No session ID. No precise timestamp. No office. No name.
// Re-identification risk: nil.

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const outcomes = sqliteTable('outcomes', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  entitlement_type: text('entitlement_type', { length: 100 }).notNull(),
  outcome_code:     text('outcome_code', { length: 20 }).notNull(),
  week:             text('week', { length: 7 }).notNull()
  // week format: 'YYYY-WW' e.g. '2026-W12'
})

// Valid outcome_code values:
// GRANTED | DENIED | NOT_ASSESSED | DEFERRED | DEFLECTED
//
// NOT_ASSESSED, DEFERRED, DEFLECTED are the advocacy signal —
// high rates on a specific entitlement indicate systematic non-assessment
