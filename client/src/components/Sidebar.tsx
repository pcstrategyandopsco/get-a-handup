import { SECTIONS } from '../engine/questions'
import type { Question } from '../engine/questions'
import type { EntitlementResult } from '../lib/types'

type Props = {
  currentSectionIndex: number
  isComplete: boolean
  results: EntitlementResult[]
  onSectionClick?: (sectionIndex: number) => void
  answeredQuestions: Question[]
}

export function Sidebar({ currentSectionIndex, isComplete, results, onSectionClick, answeredQuestions }: Props) {
  // Count answered questions per section
  const sectionCounts = new Map<number, number>()
  for (const q of answeredQuestions) {
    sectionCounts.set(q.sectionIndex, (sectionCounts.get(q.sectionIndex) ?? 0) + 1)
  }

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

            const count = sectionCounts.get(i) ?? 0

            const content = (
              <>
                <div className="step-indicator" />
                <span className="step-label">{name}</span>
                {count > 0 && <span className="step-count">{count}</span>}
              </>
            )

            if (state === 'done' && onSectionClick) {
              return (
                <button
                  key={name}
                  className={`progress-step ${state}`}
                  onClick={() => onSectionClick(i)}
                >
                  {content}
                </button>
              )
            }

            return (
              <div key={name} className={`progress-step ${state}`}>
                {content}
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
