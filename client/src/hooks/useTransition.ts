import { useState, useEffect } from 'react'
import { computeTransition } from '../engine/transition'
import { buildFacts } from '../engine/rules'
import type { IntakeAnswers, EntitlementResult, TransitionAnalysis, RateData } from '../lib/types'

// Static import — Vite bundles this from data/dist/rates.json
import ratesJson from '../../../data/dist/rates.json'

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

    // rates.json is keyed by effective date
    const ratesRaw = (ratesJson as Record<string, unknown>)['2026-04-01'] ?? ratesJson
    const rates = ratesRaw as unknown as RateData
    const facts = buildFacts(answers)
    const result = computeTransition(answers, facts, results, rates)
    setAnalysis(result)
    setIsComputing(false)
  }, [answers, results, enabled])

  return { analysis, isComputing }
}
