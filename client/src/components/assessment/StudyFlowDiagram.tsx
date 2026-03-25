import { useMemo } from 'react'
import type { TransitionAnalysis } from '../../lib/types'
import { fmt, FlowDiagramLayout } from './FlowComponents'

type Props = {
  analysis: TransitionAnalysis
}

export function StudyFlowDiagram({ analysis }: Props) {
  const { current, study_scenarios, study_verdict } = analysis

  if (study_scenarios.length === 0) return null

  const scenarios = useMemo(() =>
    study_scenarios.map(s => ({
      ...s,
      extraClass: s.is_debt ? 'flow-node--debt' : undefined,
    })),
    [study_scenarios]
  )

  const nonDebt = study_scenarios.filter(s => !s.is_debt)
  const bestNet = nonDebt.length > 0 ? Math.max(...nonDebt.map(s => s.net_weekly)) : study_scenarios[0].net_weekly
  const diff = bestNet - current.net_weekly

  const verdictText = study_verdict === 'better_studying'
    ? 'Student Allowance path keeps more income'
    : study_verdict === 'marginal'
    ? 'Funding options are close to current income'
    : 'All study paths reduce your income'

  return (
    <FlowDiagramLayout
      id="study"
      current={current}
      scenarios={scenarios}
      verdict={
        <span>
          {verdictText}. Best non-debt option: <strong>{fmt(diff)}/wk</strong> {diff >= 0 ? 'more' : 'less'} than current
        </span>
      }
    />
  )
}
