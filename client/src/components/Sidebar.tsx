import { SECTIONS } from '../engine/questions'
import type { EntitlementResult } from '../lib/types'

type Props = {
  currentSectionIndex: number
  isComplete: boolean
  results: EntitlementResult[]
}

export function Sidebar({ currentSectionIndex, isComplete, results }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-label">PROGRESS</div>
        <div className="progress-track">
          {SECTIONS.map((name, i) => {
            let state: string
            if (isComplete || i < currentSectionIndex) state = 'done'
            else if (i === currentSectionIndex) state = 'active'
            else state = 'pending'

            return (
              <div key={name} className={`progress-step ${state}`}>
                <div className="step-indicator" />
                <span className="step-label">{name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {results.length > 0 && (
        <div className="sidebar-section preview-section">
          <div className="sidebar-section-label">ENTITLEMENT PREVIEW</div>
          <div className="entitlement-preview">
            {results.map(r => {
              const cls =
                r.status === 'ENTITLED' ? 'entitled' :
                r.status === 'POSSIBLE' ? 'possible' : 'unknown'
              return (
                <div key={r.entitlement_type} className={`preview-item ${cls}`}>
                  <span>{r.name ?? r.entitlement_type}</span>
                  <span className="preview-badge">
                    {r.status === 'ENTITLED' ? 'ENTITLED' :
                     r.status === 'POSSIBLE' ? 'POSSIBLE' : 'UNKNOWN'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <p>No PII. By design. Nothing is stored or transmitted beyond this browser.</p>
      </div>
    </aside>
  )
}
