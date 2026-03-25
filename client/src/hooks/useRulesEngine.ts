import { useState, useEffect, useRef } from 'react'
import { evaluateEntitlements } from '../engine/rules'
import type { EntitlementResult, IntakeAnswers } from '../lib/types'

export type UseRulesEngineReturn = {
  results: EntitlementResult[]
  isEvaluating: boolean
}

// Debounce evaluation so it doesn't fire on every keystroke
const DEBOUNCE_MS = 300

export function useRulesEngine(answers: IntakeAnswers, enabled: boolean): UseRulesEngineReturn {
  const [results, setResults] = useState<EntitlementResult[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || Object.keys(answers).length < 2) {
      setResults([])
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setIsEvaluating(true)
      try {
        const r = await evaluateEntitlements(answers)
        setResults(r)
      } catch (err) {
        console.error('Rules evaluation error:', err)
      } finally {
        setIsEvaluating(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [answers, enabled])

  return { results, isEvaluating }
}
