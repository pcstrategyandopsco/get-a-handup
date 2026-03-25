import { useState } from 'react'
import type { EntitlementResult, OutcomeCode } from '../../lib/types'

type Props = {
  results: EntitlementResult[]
}

const OUTCOME_OPTIONS: { value: OutcomeCode; label: string }[] = [
  { value: 'GRANTED', label: 'Granted' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'NOT_ASSESSED', label: 'Not assessed' },
  { value: 'DEFERRED', label: 'Deferred' },
  { value: 'DEFLECTED', label: 'Deflected' },
]

export function OutcomeSection({ results }: Props) {
  const actionable = results.filter(
    r => r.status === 'ENTITLED' || r.status === 'POSSIBLE'
  )

  const [outcomes, setOutcomes] = useState<Record<string, OutcomeCode>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await Promise.all(
        Object.entries(outcomes).map(([entitlement_type, outcome_code]) =>
          fetch('/api/outcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entitlement_type, outcome_code }),
          })
        )
      )
      setSubmitted(true)
    } catch (err) {
      console.error('Outcome submission error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (actionable.length === 0) return null

  if (submitted) {
    return (
      <div className="outcome-section">
        <div className="outcome-success">Recorded. Thank you.</div>
      </div>
    )
  }

  return (
    <div className="outcome-section">
      <h3>AFTER YOUR APPOINTMENT</h3>
      <p>
        Your response is anonymous. No personal data is sent. Two words only:
        what you raised and what happened.
      </p>
      {actionable.map(r => (
        <div key={r.entitlement_type} className="outcome-row">
          <span>{r.name ?? r.entitlement_type}</span>
          <select
            className="outcome-select"
            value={outcomes[r.entitlement_type] ?? ''}
            onChange={e =>
              setOutcomes(prev => ({
                ...prev,
                [r.entitlement_type]: e.target.value as OutcomeCode,
              }))
            }
          >
            <option value="" disabled>
              Select outcome
            </option>
            {OUTCOME_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        className="outcome-submit-btn"
        onClick={handleSubmit}
        disabled={submitting || Object.keys(outcomes).length === 0}
      >
        {submitting ? 'Submitting...' : 'Submit outcomes'}
      </button>
    </div>
  )
}
