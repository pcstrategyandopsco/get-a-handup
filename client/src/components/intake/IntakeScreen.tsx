import type { UseIntakeReturn } from '../../hooks/useIntake'
import { QuestionBlock } from './QuestionBlock'

type Props = {
  intake: UseIntakeReturn
  onComplete: () => void
}

export function IntakeScreen({ intake, onComplete }: Props) {
  const { current, answer, back, isComplete, isEditing, finishEditing, history, currentSection, progress } = intake

  if (isComplete) {
    return (
      <div className="intake-screen">
        <div className="intake-eyebrow">INTAKE</div>
        <h2 className="intake-title">Intake complete</h2>
        <p className="intake-subtitle">
          All questions answered. Proceed to assessment to review your entitlements.
        </p>
        <button className="continue-btn" onClick={onComplete}>
          View assessment
        </button>
      </div>
    )
  }

  const handleFinishEditing = () => {
    finishEditing()
    onComplete()
  }

  return (
    <div className="intake-screen">
      <div className="intake-eyebrow">{currentSection}</div>
      <p className="intake-subtitle">
        Question {history.length + 1} &middot; {progress}% complete
      </p>

      {current && (
        <QuestionBlock
          key={current.id}
          question={current}
          onAnswer={answer}
          existingAnswer={intake.answers[current.id]}
        />
      )}

      <div className="intake-nav">
        {history.length > 0 && (
          <button className="back-link" onClick={back}>
            Back
          </button>
        )}
        {isEditing && (
          <button className="continue-btn finish-editing-btn" onClick={handleFinishEditing}>
            Re-run assessment
          </button>
        )}
      </div>
    </div>
  )
}
