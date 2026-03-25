import { useState, useEffect } from 'react'
import { computeTransition } from '../engine/transition'
import { buildFacts } from '../engine/rules'
import type { IntakeAnswers, EntitlementResult, TransitionAnalysis } from '../lib/types'
import { getRates } from '../lib/rates'

export type UseTransitionReturn = {
  analysis: TransitionAnalysis | null
  isComputing: boolean
}

export function useTransition(
  answers: IntakeAnswers,
  results: EntitlementResult[],
  enabled: boolean
): UseTransitionReturn {
  const [analysis, setAnalysis] = useState<TransitionAnalysis | null>(null)
  const [isComputing, setIsComputing] = useState(false)

  useEffect(() => {
    if (!enabled || results.length === 0) {
      setAnalysis(null)
      return
    }

    // Only compute if user is on or qualifies for a main benefit
    const hasMainBenefit = results.some(r => r.category === 'main')
    if (!hasMainBenefit) {
      setAnalysis(null)
      return
    }

    setIsComputing(true)

    const rates = getRates()
    const facts = buildFacts(answers)
    const result = computeTransition(answers, facts, results, rates)
    setAnalysis(result)
    setIsComputing(false)
  }, [answers, results, enabled])

  return { analysis, isComputing }
}
