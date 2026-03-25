import { useState, useMemo } from 'react'
import type { TransitionAnalysis, IncomeScenario, StudyVerdict, StudyProjection, StudyROIVerdict, IntakeAnswers, RateData } from '../../lib/types'
import { computeStudyProjection } from '../../engine/transition'
import { buildFacts } from '../../engine/rules'
import ratesJson from '../../../../data/dist/rates.json'

type Props = {
  analysis: TransitionAnalysis
  answers: IntakeAnswers
}

function fmt(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString()
}

function pct(n: number): string {
  return Math.round(n * 100) + '%'
}

function VerdictBadge({ verdict }: { verdict: TransitionAnalysis['verdict'] }) {
  const labels = {
    better_working: 'Working pays more',
    marginal: 'Marginal difference',
    trap: 'Basic scenario',
  }
  const cls = verdict === 'trap' ? 'verdict--trap' : verdict === 'marginal' ? 'verdict--marginal' : 'verdict--better'
  return <span className={`transition-verdict ${cls}`}>{labels[verdict]}</span>
}

function StudyVerdictBadge({ verdict }: { verdict: StudyVerdict }) {
  if (!verdict) return null
  const labels = {
    better_studying: 'Study pays more',
    marginal: 'Marginal difference',
    trap: 'Basic scenario',
  }
  const cls = verdict === 'trap' ? 'verdict--trap' : verdict === 'marginal' ? 'verdict--marginal' : 'verdict--better'
  return <span className={`transition-verdict ${cls}`}>{labels[verdict]}</span>
}

function ROIBadge({ verdict }: { verdict: StudyROIVerdict }) {
  const labels: Record<StudyROIVerdict, string> = {
    strong_return: 'Strong return',
    moderate_return: 'Moderate return',
    long_payback: 'Long payback',
    net_loss: 'Net loss',
  }
  const cls = verdict === 'strong_return' ? 'roi--strong'
    : verdict === 'moderate_return' ? 'roi--moderate'
    : verdict === 'long_payback' ? 'roi--long'
    : 'roi--loss'
  return <span className={`study-roi-badge ${cls}`}>{labels[verdict]}</span>
}

const SALARY_OPTIONS = [
  { label: 'Min wage ($23.15/hr)', value: 23.15 },
  { label: 'Living wage ($27.80/hr)', value: 27.80 },
  { label: 'Median wage ($35.00/hr)', value: 35.00 },
  { label: 'Above median ($45.50/hr)', value: 45.50 },
]

const TRAINING_OPTIONS = [
  { label: '6 months', value: 26 },
  { label: '1 year', value: 52 },
  { label: '2 years', value: 104 },
  { label: '3 years', value: 156 },
]

const JOB_SEARCH_OPTIONS = [
  { label: 'Immediate', value: 0 },
  { label: '3 months', value: 13 },
  { label: '6 months', value: 26 },
  { label: '12 months', value: 52 },
]

function weeksToLabel(weeks: number): string {
  if (weeks <= 1) return '1 week'
  if (weeks < 8) return `${weeks} weeks`
  if (weeks < 52) return `${Math.round(weeks / 4.33)} months`
  const years = Math.floor(weeks / 52)
  const remaining = weeks % 52
  if (remaining < 4) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${Math.round(remaining / 4.33)}m`
}

function ScenarioRow({ scenario, isCurrent, isDebt, isBest }: { scenario: IncomeScenario; isCurrent?: boolean; isDebt?: boolean; isBest?: boolean }) {
  const classes = [
    'transition-row',
    isCurrent ? 'transition-row--current' : '',
    isDebt ? 'transition-row--debt' : '',
    isBest ? 'transition-row--best' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className="transition-row-label">{scenario.label}</span>
      <span className="transition-row-gross">{fmt(scenario.gross_weekly)}</span>
      <span className="transition-row-deductions">
        -{fmt(scenario.tax_weekly + scenario.acc_weekly + scenario.abatement_weekly)}
      </span>
      <span className="transition-row-additions">
        +{fmt(scenario.benefit_weekly + scenario.supplements_weekly + scenario.work_incentives_weekly)}
      </span>
      <span className="transition-row-net">{fmt(scenario.net_weekly)}/wk</span>
      <span className="transition-row-emtr">{pct(scenario.effective_tax_rate)}</span>
    </div>
  )
}

export function TransitionSection({ analysis, answers }: Props) {
  const { current, scenarios, crossover_hourly_rate, housing_cliff, gains, losses, net_gain_at_fulltime, verdict, study_scenarios, study_gains, study_losses, study_verdict } = analysis

  const [targetSalary, setTargetSalary] = useState(35.00)
  const [trainingWeeks, setTrainingWeeks] = useState(52)
  const [jobSearchWeeks, setJobSearchWeeks] = useState(13)

  // Use SA+AB scenario (index 0) — represents actually switching to StudyLink.
  // TIA stays on benefit, so has no investment cost and no meaningful breakeven.
  const projection = useMemo<StudyProjection | null>(() => {
    if (study_scenarios.length === 0) return null

    const saScenarioNet = study_scenarios[0].net_weekly
    const ratesRaw = (ratesJson as Record<string, unknown>)['2026-04-01'] ?? ratesJson
    const rates = ratesRaw as unknown as RateData
    const facts = buildFacts(answers)

    return computeStudyProjection(
      targetSalary, trainingWeeks, jobSearchWeeks,
      current.net_weekly, saScenarioNet, facts, rates
    )
  }, [targetSalary, trainingWeeks, jobSearchWeeks, study_scenarios, current.net_weekly, answers])

  return (
    <section className="dash-section transition-section dash-delay-7">
      <div className="dash-section-header">
        <span className="dash-section-title">What if you worked?</span>
        <VerdictBadge verdict={verdict} />
      </div>

      <div className="transition-table">
        <div className="transition-header-row">
          <span className="transition-row-label">Scenario</span>
          <span className="transition-row-gross">Gross</span>
          <span className="transition-row-deductions">Deductions</span>
          <span className="transition-row-additions">Additions</span>
          <span className="transition-row-net">Net</span>
          <span className="transition-row-emtr">EMTR</span>
        </div>
        <ScenarioRow scenario={current} isCurrent />
        {scenarios.map((s, i) => (
          <ScenarioRow key={i} scenario={s} />
        ))}
      </div>

      {/* Crossover line */}
      <div className="transition-crossover">
        {crossover_hourly_rate ? (
          <p>Working pays more at <strong>${crossover_hourly_rate.toFixed(2)}/hr</strong> full-time (40hrs)</p>
        ) : (
          <p>At minimum wage full-time, you would be <strong>{fmt(net_gain_at_fulltime)}/wk</strong> {net_gain_at_fulltime >= 0 ? 'better off' : 'worse off'}</p>
        )}
      </div>

      {/* Gains and losses */}
      <div className="transition-changes">
        {gains.length > 0 && (
          <div className="transition-changes-col">
            <span className="transition-changes-label transition-changes-label--gain">Gained off-benefit</span>
            {gains.map((g, i) => (
              <div key={i} className="transition-change transition-change--gain">+ {g}</div>
            ))}
          </div>
        )}
        {losses.length > 0 && (
          <div className="transition-changes-col">
            <span className="transition-changes-label transition-changes-label--loss">Lost off-benefit</span>
            {losses.map((l, i) => (
              <div key={i} className="transition-change transition-change--loss">- {l}</div>
            ))}
          </div>
        )}
      </div>

      {/* Housing cliff warning */}
      {housing_cliff > 100 && (
        <div className="transition-warning">
          Housing support drops by {fmt(housing_cliff)}/wk off-benefit. Accommodation Supplement
          (up to {fmt(housing_cliff + 60)}/wk) is replaced by Accommodation Benefit (max $60/wk).
        </div>
      )}

      {/* EMTR bar */}
      <div className="transition-emtr-section">
        <span className="transition-emtr-label">Effective marginal tax rate (above $160/wk earned)</span>
        <div className="transition-emtr-bar-container">
          <div
            className="transition-emtr-bar"
            style={{ width: `${Math.min(100, current.effective_tax_rate * 100)}%` }}
          />
          <span className="transition-emtr-value">{pct(current.effective_tax_rate)}</span>
        </div>
        <span className="transition-emtr-note">
          Of each dollar earned above $160/wk, you keep {pct(1 - current.effective_tax_rate)}
        </span>
      </div>

      {/* ── Study pathway ── */}
      {study_scenarios.length > 0 && study_verdict && (
        <>
          <div className="dash-section-header" style={{ marginTop: 32 }}>
            <span className="dash-section-title">What if you trained for a higher-paying job?</span>
          </div>

          <div className="study-intro">
            <p>
              Training for a qualification — builder, electrician, nurse, IT — means less income
              now but higher earning potential later. Below is what that trade-off actually looks
              like with your current circumstances.
            </p>
          </div>

          {/* ── Part 1: Funding while studying ── */}
          <div className="study-subsection-header">
            <span className="study-subsection-title">Your income while studying</span>
            <StudyVerdictBadge verdict={study_verdict} />
          </div>
          <p className="study-subsection-desc">
            Three ways to fund your living costs during training. Tuition fees are
            covered by fees-free (first 3 years of tertiary) or Student Loan (repayable).
            These figures are your weekly take-home for living expenses only.
          </p>

          <div className="transition-table">
            <div className="transition-header-row">
              <span className="transition-row-label">Funding option</span>
              <span className="transition-row-gross">Gross</span>
              <span className="transition-row-deductions">Deductions</span>
              <span className="transition-row-additions">Additions</span>
              <span className="transition-row-net">Net</span>
              <span className="transition-row-emtr">EMTR</span>
            </div>
            <ScenarioRow scenario={current} isCurrent />
            {study_scenarios.map((s, i) => {
              const isDebt = s.label.includes('DEBT')
              const isBest = !isDebt && s.net_weekly >= Math.max(...study_scenarios.filter(x => !x.label.includes('DEBT')).map(x => x.net_weekly))
              return <ScenarioRow key={i} scenario={s} isDebt={isDebt} isBest={isBest} />
            })}
          </div>

          <div className="study-funding-notes">
            <div className="study-funding-note">
              <span className="study-funding-note-label">Student Allowance + AB</span>
              <span className="study-funding-note-desc">
                Leave your benefit, switch to StudyLink. Not repayable. Accommodation Benefit replaces
                Accommodation Supplement (lower rate).
              </span>
            </div>
            <div className="study-funding-note">
              <span className="study-funding-note-label">Benefit + TIA</span>
              <span className="study-funding-note-desc">
                Stay on your current benefit. Training Incentive Allowance adds up to $106.75/wk
                for approved NZQF 1-7 courses. Capped at $5,550.80/yr. Requires case manager approval.
              </span>
            </div>
            <div className="study-funding-note">
              <span className="study-funding-note-label">Student Loan only</span>
              <span className="study-funding-note-desc">
                Living costs borrowed via Student Loan. This is debt, repaid at 12% of income above
                $22,828/yr once working. No entitlement to AB or supplements.
              </span>
            </div>
          </div>

          {/* Gains and losses */}
          <div className="transition-changes">
            {study_gains.length > 0 && (
              <div className="transition-changes-col">
                <span className="transition-changes-label transition-changes-label--gain">Gained studying</span>
                {study_gains.map((g, i) => (
                  <div key={i} className="transition-change transition-change--gain">+ {g}</div>
                ))}
              </div>
            )}
            {study_losses.length > 0 && (
              <div className="transition-changes-col">
                <span className="transition-changes-label transition-changes-label--loss">Lost switching to StudyLink</span>
                {study_losses.map((l, i) => (
                  <div key={i} className="transition-change transition-change--loss">- {l}</div>
                ))}
              </div>
            )}
          </div>

          {/* ── Part 2: Post-study projection ── */}
          <div className="study-subsection-header" style={{ marginTop: 24 }}>
            <span className="study-subsection-title">After you qualify</span>
            {projection && <ROIBadge verdict={projection.roi_verdict} />}
          </div>
          <p className="study-subsection-desc">
            Training costs you income now. This projection compares staying on benefit for 5 years
            against studying on Student Allowance then working at your target salary. Adjust the
            inputs to match the qualification you're considering.
          </p>

          <div className="study-projection-controls">
            <div className="study-projection-control">
              <label className="study-projection-label">Target salary</label>
              <select
                className="study-projection-select"
                value={targetSalary}
                onChange={e => setTargetSalary(Number(e.target.value))}
              >
                {SALARY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="study-projection-control">
              <label className="study-projection-label">Training duration</label>
              <select
                className="study-projection-select"
                value={trainingWeeks}
                onChange={e => setTrainingWeeks(Number(e.target.value))}
              >
                {TRAINING_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="study-projection-control">
              <label className="study-projection-label">Time to employment</label>
              <select
                className="study-projection-select"
                value={jobSearchWeeks}
                onChange={e => setJobSearchWeeks(Number(e.target.value))}
              >
                {JOB_SEARCH_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {projection && (
            <>
              <div className="transition-table" style={{ marginTop: 0 }}>
                <div className="transition-header-row">
                  <span className="transition-row-label">Post-study scenario</span>
                  <span className="transition-row-gross">Gross</span>
                  <span className="transition-row-deductions">Deductions</span>
                  <span className="transition-row-additions">Additions</span>
                  <span className="transition-row-net">Net</span>
                  <span className="transition-row-emtr">EMTR</span>
                </div>
                <ScenarioRow scenario={current} isCurrent />
                <ScenarioRow scenario={projection.post_study_scenario} isBest />
              </div>

              <div className="study-projection-result">
                <div className="study-projection-stat">
                  <span className="study-projection-stat-label">Breakeven</span>
                  <span className="study-projection-stat-value">
                    {projection.breakeven_weeks
                      ? `${weeksToLabel(projection.breakeven_weeks)} after starting study`
                      : 'Does not break even within 5 years'}
                  </span>
                </div>
                <div className="study-projection-stat">
                  <span className="study-projection-stat-label">5-year net</span>
                  <span className={`study-projection-stat-value ${projection.five_year_gain >= 0 ? 'study-projection-stat--positive' : 'study-projection-stat--negative'}`}>
                    {fmt(projection.five_year_gain)} compared to staying on benefit
                  </span>
                </div>
              </div>

              <div className="study-projection-timeline">
                <span className="study-projection-timeline-label">Your 5-year path</span>
                <div className="study-projection-timeline-phases">
                  <span className="study-projection-phase study-projection-phase--training">
                    Training ({weeksToLabel(projection.training_weeks)}) — {fmt(projection.study_phase_net)}/wk
                  </span>
                  <span className="study-projection-phase-arrow">&rarr;</span>
                  {projection.job_search_weeks > 0 && (
                    <>
                      <span className="study-projection-phase study-projection-phase--search">
                        Job search ({weeksToLabel(projection.job_search_weeks)}) — {fmt(current.net_weekly)}/wk
                      </span>
                      <span className="study-projection-phase-arrow">&rarr;</span>
                    </>
                  )}
                  <span className="study-projection-phase study-projection-phase--working">
                    Working at ${projection.target_hourly.toFixed(2)}/hr — {fmt(projection.post_study_scenario.net_weekly)}/wk
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
