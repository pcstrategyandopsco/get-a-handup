import { useRef, useState, useEffect, forwardRef, lazy, Suspense } from 'react'
import type { IntakeAnswers } from '../lib/types'
import type { TestScenario } from '../lib/scenarios'
import { expandAbbreviations } from '../lib/expand-abbreviations'

type HeaderProps = {
  onLoadScenario: (file: File) => void
  onSaveProgress: () => void
  onLoadTestScenario?: (answers: IntakeAnswers) => void
}

export function Header({ onLoadScenario, onSaveProgress, onLoadTestScenario }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [selected, setSelected] = useState<TestScenario | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scenarioOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setScenarioOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [scenarioOpen])

  return (
    <header className="header">
      <div className="header-tab">
        <h1>Entitlement Navigator</h1>
      </div>
      <div className="header-sub">
        <span>NZ Social Security Act 2018</span>
      </div>
      <div className="header-right">
        <a
          className="header-load-btn"
          href="./how-it-works.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          How it works
        </a>
        <button
          className="header-load-btn"
          onClick={onSaveProgress}
        >
          Save Progress
        </button>
        <button
          className="header-load-btn"
          onClick={() => fileRef.current?.click()}
        >
          Load Session
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".yaml,.yml,.json"
          hidden
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) onLoadScenario(file)
            e.target.value = ''
          }}
        />
        {onLoadTestScenario && (
          <ScenarioDropdown
            ref={dropdownRef}
            open={scenarioOpen}
            onToggle={() => setScenarioOpen(o => !o)}
            onSelect={scenario => {
              setSelected(scenario)
              setScenarioOpen(false)
            }}
          />
        )}
        <div className="header-stat">
          <span className="header-stat-label">Rules Version</span>
          <span className="header-stat-value">SSA-2024.Q4</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">Engine</span>
          <span className="header-stat-value">IN-BROWSER</span>
        </div>
        <div className="status-dot" aria-label="System active" />
      </div>

      {selected && onLoadTestScenario && (
        <div className="scenario-modal-overlay" onMouseDown={() => setSelected(null)}>
          <div className="scenario-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="scenario-modal-header">
              <span className="scenario-modal-label">Test Scenario</span>
              <button className="scenario-modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <h2 className="scenario-modal-title">{selected.name}</h2>
            {selected.description && (
              <p className="scenario-modal-desc">{expandAbbreviations(selected.description)}</p>
            )}
            {selected.notes.length > 0 && (
              <div className="scenario-modal-notes">
                <span className="scenario-modal-notes-label">Context</span>
                {selected.notes.map((note, i) => (
                  <p key={i} className="scenario-modal-note">{expandAbbreviations(note)}</p>
                ))}
              </div>
            )}
            <div className="scenario-modal-footer">
              <button
                className="scenario-modal-cancel"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                className="scenario-modal-test"
                onClick={() => {
                  onLoadTestScenario(selected.answers)
                  setSelected(null)
                }}
              >
                Test it
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* Lazy-load scenarios only in dev */

type ScenarioDropdownProps = {
  open: boolean
  onToggle: () => void
  onSelect: (scenario: TestScenario) => void
}

const ScenarioList = lazy(() =>
  import('../lib/scenarios').then(mod => ({
    default: function ScenarioListInner({ onSelect }: { onSelect: (scenario: TestScenario) => void }) {
      return (
        <>
          {mod.TEST_SCENARIOS.map(s => (
            <button
              key={s.id}
              className="scenario-item"
              onClick={() => onSelect(s)}
            >
              {s.name}
            </button>
          ))}
        </>
      )
    },
  }))
)

const ScenarioDropdown = forwardRef<HTMLDivElement, ScenarioDropdownProps>(
  function ScenarioDropdown({ open, onToggle, onSelect }, ref) {
    return (
      <div className="scenario-dropdown" ref={ref}>
        <button className="header-load-btn scenario-btn" onClick={onToggle}>
          Test Scenarios
        </button>
        {open && (
          <div className="scenario-panel">
            <Suspense fallback={<div className="scenario-item" style={{ color: 'var(--text-dim)' }}>Loading...</div>}>
              <ScenarioList onSelect={onSelect} />
            </Suspense>
          </div>
        )}
      </div>
    )
  }
)
