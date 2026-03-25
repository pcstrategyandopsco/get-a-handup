import { useState, useCallback, useMemo } from 'react'
import { questions, questionsById, FIRST_QUESTION_ID, SECTIONS, getTriageMode, type Question } from '../engine/questions'
import type { IntakeAnswers } from '../lib/types'

export type IntakeState = {
  answers: IntakeAnswers
  history: string[]
  currentId: string | null
  isComplete: boolean
}

export type UseIntakeReturn = {
  current: Question | null
  answers: IntakeAnswers
  history: string[]
  answer: (value: unknown) => void
  back: () => void
  loadScenario: (answers: IntakeAnswers) => void
  continueFullAssessment: () => void
  isComplete: boolean
  progress: number          // 0-100
  currentSection: string
  currentSectionIndex: number
  answeredQuestions: Question[]
}

const FULL_TOTAL = questions.length
const CRISIS_TOTAL = 8
const SANCTIONS_TOTAL = 10
const APPEAL_TOTAL = 10

export function useIntake(): UseIntakeReturn {
  const [state, setState] = useState<IntakeState>({
    answers: {},
    history: [],
    currentId: FIRST_QUESTION_ID,
    isComplete: false
  })

  const answer = useCallback((value: unknown) => {
    setState(prev => {
      if (!prev.currentId) return prev

      const current = questionsById[prev.currentId]
      if (!current) return prev

      const newAnswers = { ...prev.answers, [prev.currentId]: value }
      const nextId = current.next(value, newAnswers)

      return {
        answers: newAnswers,
        history: [...prev.history, prev.currentId],
        currentId: nextId,
        isComplete: nextId === null
      }
    })
  }, [])

  const loadScenario = useCallback((scenarioAnswers: IntakeAnswers) => {
    const history: string[] = []
    // If scenario has no triage.reason, start from personal.age for backward compat
    const startId = scenarioAnswers['triage.reason'] !== undefined ? FIRST_QUESTION_ID : 'personal.age'
    let currentId: string | null = startId
    while (currentId && scenarioAnswers[currentId] !== undefined) {
      history.push(currentId)
      const q: Question | undefined = questionsById[currentId]
      if (!q) break
      currentId = q.next(scenarioAnswers[currentId], scenarioAnswers)
    }
    setState({
      answers: scenarioAnswers,
      history,
      currentId,
      isComplete: currentId === null
    })
  }, [])

  const continueFullAssessment = useCallback(() => {
    setState(prev => {
      // Switch triage.reason to full mode and replay from start
      const newAnswers: IntakeAnswers = { ...prev.answers, 'triage.reason': 'Full assessment of everything I might be entitled to' }
      const history: string[] = []
      let currentId: string | null = FIRST_QUESTION_ID
      while (currentId && newAnswers[currentId] !== undefined) {
        history.push(currentId)
        const q: Question | undefined = questionsById[currentId]
        if (!q) break
        currentId = q.next(newAnswers[currentId], newAnswers)
      }
      return {
        answers: newAnswers,
        history,
        currentId,
        isComplete: currentId === null
      }
    })
  }, [])

  const back = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev
      const newHistory = prev.history.slice(0, -1)
      const prevId = prev.history[prev.history.length - 1]

      // Remove the answer for the question we're going back to
      const newAnswers = { ...prev.answers }
      delete newAnswers[prev.currentId ?? '']

      return {
        answers: newAnswers,
        history: newHistory,
        currentId: prevId,
        isComplete: false
      }
    })
  }, [])

  const current = state.currentId ? (questionsById[state.currentId] ?? null) : null

  const progress = useMemo(() => {
    if (state.isComplete) return 100
    const mode = getTriageMode(state.answers)
    const pathTotal = mode === 'crisis' ? CRISIS_TOTAL
      : mode === 'sanctions' ? SANCTIONS_TOTAL
      : mode === 'appeal' ? APPEAL_TOTAL
      : FULL_TOTAL
    return Math.min(95, Math.round((state.history.length / pathTotal) * 100))
  }, [state.history.length, state.isComplete, state.answers])

  const currentSection = current?.section ?? SECTIONS[SECTIONS.length - 1]
  const currentSectionIndex = current?.sectionIndex ?? SECTIONS.length - 1

  const answeredQuestions = useMemo(() => {
    return state.history
      .map(id => questionsById[id])
      .filter(Boolean) as Question[]
  }, [state.history])

  return {
    current,
    answers: state.answers,
    history: state.history,
    answer,
    back,
    loadScenario,
    continueFullAssessment,
    isComplete: state.isComplete,
    progress,
    currentSection,
    currentSectionIndex,
    answeredQuestions
  }
}
