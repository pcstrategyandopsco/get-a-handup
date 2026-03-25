type Screen = 'intake' | 'assessment' | 'document'

type Props = {
  active: Screen
  onSelect: (s: Screen) => void
  assessmentUnlocked: boolean
  documentUnlocked: boolean
}

const tabs: { id: Screen; label: string }[] = [
  { id: 'intake', label: 'INTAKE' },
  { id: 'assessment', label: 'ASSESSMENT' },
  { id: 'document', label: 'DOCUMENT' },
]

export function ScreenTabs({ active, onSelect, assessmentUnlocked, documentUnlocked }: Props) {
  return (
    <div className="screen-tabs">
      {tabs.map(tab => {
        const disabled =
          (tab.id === 'assessment' && !assessmentUnlocked) ||
          (tab.id === 'document' && !documentUnlocked)

        return (
          <button
            key={tab.id}
            className={`screen-tab${active === tab.id ? ' active' : ''}${disabled ? ' disabled' : ''}`}
            onClick={() => !disabled && onSelect(tab.id)}
            disabled={disabled}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
