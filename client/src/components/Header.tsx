import { useRef } from 'react'

type HeaderProps = {
  onLoadScenario: (file: File) => void
  onSaveProgress: () => void
}

export function Header({ onLoadScenario, onSaveProgress }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header className="header">
      <div className="header-tab">
        <h1>Entitlement Navigator</h1>
      </div>
      <div className="header-sub">
        <span>NZ Social Security Act 2018</span>
      </div>
      <div className="header-right">
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
    </header>
  )
}
