import { useState, useMemo } from 'react'
import type { TransitionAnalysis, EntitlementResult, IntakeAnswers } from '../../lib/types'
import { buildFacts } from '../../engine/rules'
import { buildScenario, getBenefitBaseWeekly, getAbatementParams, MIN_WAGE_2026 } from '../../engine/transition'
import { fmt, FlowDiagramLayout } from './FlowComponents'
import { getRates } from '../../lib/rates'

type Props = {
  analysis: TransitionAnalysis
  answers: IntakeAnswers
  results: EntitlementResult[]
}

export function TransitionFlowDiagram({ analysis, answers, results }: Props) {
  const [hourlyRate, setHourlyRate] = useState(MIN_WAGE_2026)
  const rates = getRates()

  const customScenarios = useMemo(() => {
    const facts = buildFacts(answers)
    const benefitBase = getBenefitBaseWeekly(facts, rates)
    const abatementParams = getAbatementParams(facts, rates)

    return [
      buildScenario('Part-time 20hrs', 20, hourlyRate, true, facts, results, rates, benefitBase, abatementParams),
      buildScenario('Full-time 40hrs', 40, hourlyRate, false, facts, results, rates, benefitBase, abatementParams),
      buildScenario(`Full-time +$5/hr`, 40, hourlyRate + 5, false, facts, results, rates, benefitBase, abatementParams),
    ]
  }, [hourlyRate, answers, results, rates])

  const { current } = analysis

  return (
    <FlowDiagramLayout
      id="transition"
      current={current}
      scenarios={customScenarios}
      header={
        <div className="flow-wage-control">
          <label className="flow-wage-label">What could you earn?</label>
          <input
            type="range"
            className="flow-wage-slider"
            min={20}
            max={50}
            step={0.5}
            value={hourlyRate}
            onChange={e => setHourlyRate(Number(e.target.value))}
          />
          <span className="flow-wage-value">${hourlyRate.toFixed(2)}/hr</span>
        </div>
      }
      verdict={
        analysis.crossover_hourly_rate ? (
          <span>Working pays more at <strong>${analysis.crossover_hourly_rate.toFixed(2)}/hr</strong> full-time</span>
        ) : (
          <span>At ${hourlyRate.toFixed(2)}/hr full-time: <strong>{fmt(customScenarios[1]?.net_weekly - current.net_weekly)}/wk</strong> {(customScenarios[1]?.net_weekly ?? 0) >= current.net_weekly ? 'better off' : 'worse off'}</span>
        )
      }
    />
  )
}
