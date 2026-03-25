import type { Question } from '../../engine/questions'
import { AnswerOptions } from './AnswerOptions'

type Props = {
  question: Question
  onAnswer: (value: unknown) => void
  answered?: unknown
}

export function QuestionBlock({ question, onAnswer, answered }: Props) {
  const isAnswered = answered !== undefined

  return (
    <div className={`question-block${isAnswered ? ' answered' : ''}`}>
      <div className="question-number">{question.number}</div>
      <div className="question-text">{question.text}</div>
      {question.hint && !isAnswered && (
        <div className="question-hint">{question.hint}</div>
      )}
      {isAnswered ? (
        <div className="answered-value">{String(answered)}</div>
      ) : (
        <AnswerOptions question={question} onAnswer={onAnswer} />
      )}
    </div>
  )
}
