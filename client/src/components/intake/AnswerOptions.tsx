import { useState } from 'react'
import type { Question } from '../../engine/questions'

type Props = {
  question: Question
  onAnswer: (value: unknown) => void
  existingAnswer?: unknown
}

export function AnswerOptions({ question, onAnswer, existingAnswer }: Props) {
  const [inputValue, setInputValue] = useState(() => {
    if (existingAnswer === undefined) return ''
    if (question.type === 'number') return String(existingAnswer)
    if (question.type === 'text') return String(existingAnswer)
    return ''
  })
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (existingAnswer !== undefined && question.type === 'multi-choice' && Array.isArray(existingAnswer)) {
      return new Set(existingAnswer as string[])
    }
    return new Set()
  })

  if (question.type === 'multi-choice') {
    const options = question.options ?? []

    const toggle = (opt: string) => {
      setSelected(prev => {
        const next = new Set(prev)
        if (opt === 'None of these') {
          return new Set(['None of these'])
        }
        next.delete('None of these')
        if (next.has(opt)) next.delete(opt)
        else next.add(opt)
        return next
      })
    }

    return (
      <div className="answer-options" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        {options.map(opt => (
          <button
            key={opt}
            className={`answer-btn${selected.has(opt) ? ' selected' : ''}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
        <button
          className="continue-btn"
          onClick={() => onAnswer([...selected])}
          disabled={selected.size === 0}
        >
          Continue
        </button>
      </div>
    )
  }

  if (question.type === 'choice' || question.type === 'boolean') {
    const options = question.type === 'boolean'
      ? ['Yes', 'No']
      : question.options ?? []

    return (
      <div className="answer-options">
        {options.map(opt => (
          <button
            key={opt}
            className={`answer-btn${existingAnswer === opt ? ' selected' : ''}`}
            onClick={() => onAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'number') {
    return (
      <div className="answer-options answer-options--stacked">
        <div className="answer-input-wrap">
          <input
            className="answer-input"
            type="number"
            placeholder={question.placeholder ?? '0'}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputValue !== '') {
                onAnswer(Number(inputValue))
              }
            }}
            autoFocus
          />
          {question.unit && <span className="input-unit">{question.unit}</span>}
        </div>
        <button
          className="continue-btn"
          onClick={() => inputValue !== '' && onAnswer(Number(inputValue))}
          disabled={inputValue === ''}
        >
          Continue
        </button>
      </div>
    )
  }

  if (question.type === 'text') {
    return (
      <div className="answer-options answer-options--stacked">
        <div className="answer-input-wrap">
          <input
            className="answer-input"
            type="text"
            placeholder={question.placeholder ?? ''}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputValue.trim() !== '') {
                onAnswer(inputValue.trim())
              }
            }}
            autoFocus
          />
        </div>
        <button
          className="continue-btn"
          onClick={() => inputValue.trim() !== '' && onAnswer(inputValue.trim())}
          disabled={inputValue.trim() === ''}
        >
          Continue
        </button>
      </div>
    )
  }

  if (question.type === 'upload') {
    return (
      <div className="answer-options">
        <div className="placeholder-state">Document upload coming soon.</div>
        {question.options?.map(opt => (
          <button
            key={opt}
            className="answer-btn"
            onClick={() => onAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  return null
}
