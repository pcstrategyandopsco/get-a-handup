import { useState, useMemo } from 'react'
import type { TransitionAnalysis, IncomeScenario, StudyVerdict, StudyProjection, StudyROIVerdict, IntakeAnswers, EntitlementResult } from '../../lib/types'
import { computeStudyProjection } from '../../engine/transition'
import { buildFacts } from '../../engine/rules'
import { TransitionFlowDiagram } from './TransitionFlowDiagram'
import { StudyFlowDiagram } from './StudyFlowDiagram'
import { fmt } from './FlowComponents'
import { getRates } from '../../lib/rates'

type Props = {
  analysis: TransitionAnalysis
  answers: IntakeAnswers
  results?: EntitlementResult[]
}

function pct(n: number): string {
  return Math.round(n * 100) + '%'
}

export function VerdictBadge({ verdict }: { verdict: TransitionAnalysis['verdict'] }) {
  const labels = {
    better_working: 'Working pays more',
    marginal: 'Marginal difference',
    trap: 'Basic scenario',
  }
  const cls = verdict === 'trap' ? 'verdict--trap' : verdict === 'marginal' ? 'verdict--marginal' : 'verdict--better'
  return <span className={`transition-verdict ${cls}`}>{labels[verdict]}</span>
}

export function StudyVerdictBadge({ verdict }: { verdict: StudyVerdict }) {
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
        -{fmt(scenario.tax_weekly + scenario.acc_weekly + scenario.abatement_weekly + (scenario.childcare_cost_weekly ?? 0))}
      </span>
      <span className="transition-row-additions">
        +{fmt(scenario.benefit_weekly + scenario.supplements_weekly + scenario.work_incentives_weekly)}
      </span>
      <span className="transition-row-net">{fmt(scenario.net_weekly)}/wk</span>
      <span className="transition-row-emtr">{pct(scenario.effective_tax_rate)}</span>
    </div>
  )
}

export function WorkSection({ analysis, answers, results = [] }: Props) {
  const { current, scenarios, crossover_hourly_rate, housing_cliff, gains, losses, net_gain_at_fulltime, verdict } = analysis
  const [viewMode, setViewMode] = useState<'table' | 'flow'>('table')

  return (
    <section className="dash-section transition-section dash-delay-1">
      <div className="dash-section-header">
        <span className="dash-section-title">What if you worked?</span>
        <button
          className="flow-toggle-btn"
          onClick={() => setViewMode(v => v === 'table' ? 'flow' : 'table')}
        >
          {viewMode === 'table' ? 'View as flow diagram' : 'View as table'}
          <span className="flow-experimental-badge">Experimental</span>
        </button>
        <VerdictBadge verdict={verdict} />
      </div>

      {viewMode === 'flow' && <TransitionFlowDiagram analysis={analysis} answers={answers} results={results} />}

      {viewMode === 'table' && <>
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
      </>}
    </section>
  )
}

export function StudySection({ analysis, answers }: Props) {
  const { current, study_scenarios, study_gains, study_losses, study_verdict } = analysis

  const [viewMode, setViewMode] = useState<'table' | 'flow'>('table')
  const [targetSalary, setTargetSalary] = useState(35.00)
  const [trainingWeeks, setTrainingWeeks] = useState(52)
  const [jobSearchWeeks, setJobSearchWeeks] = useState(13)

  const projection = useMemo<StudyProjection | null>(() => {
    if (study_scenarios.length === 0) return null

    const saScenarioNet = study_scenarios[0].net_weekly
    const rates = getRates()
    const facts = buildFacts(answers)

    return computeStudyProjection(
      targetSalary, trainingWeeks, jobSearchWeeks,
      current.net_weekly, saScenarioNet, facts, rates
    )
  }, [targetSalary, trainingWeeks, jobSearchWeeks, study_scenarios, current.net_weekly, answers])

  if (study_scenarios.length === 0 || !study_verdict) return null

  return (
    <section className="dash-section transition-section dash-delay-1">
      <div className="dash-section-header">
        <span className="dash-section-title">What if you trained for a higher-paying job?</span>
        <button
          className="flow-toggle-btn"
          onClick={() => setViewMode(v => v === 'table' ? 'flow' : 'table')}
        >
          {viewMode === 'table' ? 'View as flow diagram' : 'View as table'}
          <span className="flow-experimental-badge">Experimental</span>
        </button>
      </div>

      <div className="study-intro">
        <p>
          Training for a qualification means less income now but higher earning potential later.
          The funding options below show what you'd actually take home each week. Tuition fees
          are separate — see the fees-free warning below.
        </p>
      </div>

      {/* Part 1: Funding while studying */}
      <div className="study-subsection-header">
        <span className="study-subsection-title">Your income while studying</span>
        <StudyVerdictBadge verdict={study_verdict} />
      </div>
      <p className="study-subsection-desc">
        Three ways to fund your living costs during training. These figures are your
        weekly take-home for living expenses only — tuition costs are separate (see
        fees-free note below).
      </p>

      {viewMode === 'flow' && <StudyFlowDiagram analysis={analysis} />}

      {viewMode === 'table' && <div className="transition-table">
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
          const isDebt = s.is_debt === true
          const isBest = !isDebt && s.net_weekly >= Math.max(...study_scenarios.filter(x => !x.is_debt).map(x => x.net_weekly))
          return <ScenarioRow key={i} scenario={s} isDebt={isDebt} isBest={isBest} />
        })}
      </div>}

      {viewMode === 'table' && <>
      <div className="study-funding-notes">
        <div className="study-funding-note">
          <span className="study-funding-note-label">Student Allowance + AB</span>
          <span className="study-funding-note-desc">
            Leave your benefit, apply through StudyLink (not WINZ). Not repayable, but means-tested:
            parental income tested if under 24 (reduced above $70k, zero above $137k joint parental
            income), partner income tested if partnered. Your benefit stops when SA starts — there
            may be a gap with no income. Accommodation Benefit ($60/wk max) replaces Accommodation
            Supplement (much lower).
          </span>
        </div>
        <div className="study-funding-note">
          <span className="study-funding-note-label">Benefit + TIA</span>
          <span className="study-funding-note-desc">
            Stay on your current benefit. TIA covers course costs: fees, equipment, transport,
            childcare, internet — up to $5,550.80/yr. Requires case manager pre-approval and
            appointment within 28 days of course start. NZQF levels 1-7 only. Equipment paid
            via green card at retailer, not bank account. TIA and Student Loan can be used together.
          </span>
        </div>
        <div className="study-funding-note">
          <span className="study-funding-note-label">Student Loan only</span>
          <span className="study-funding-note-desc">
            Living costs via Student Loan ($323/wk). This is debt — repaid at 12% of income above
            $22,828/yr once working. Interest-free while in NZ. Must be full-time at a TEC-approved
            provider in a recognised programme. Not available if on a main benefit, aged 55+, or
            in certain Youth Guarantee programmes. Cannot be backdated.
          </span>
        </div>
      </div>

      <div className="transition-warning">
        <strong>Fees-free: final year only, paid in arrears.</strong>{' '}
        Since January 2025, fees-free covers your final 1 EFTS of study (roughly 1 year full-time),
        up to $12,000. You pay fees upfront when you enrol. IRD reimburses you after you complete
        and pass your qualification. If you have a Student Loan for fees, the reimbursement reduces
        your loan balance. If you do not complete, you keep the debt. This is a one-time entitlement
        — once per lifetime. For courses longer than 1 year, you must Student Loan your fees for
        the earlier years.
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
      </>}

      {/* Part 2: Post-study projection */}
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
        <div className="study-projection-control study-projection-control--slider">
          <label className="study-projection-label">Target salary</label>
          <div className="flow-wage-control" style={{ margin: 0 }}>
            <input
              type="range"
              className="flow-wage-slider"
              min={23}
              max={50}
              step={0.5}
              value={targetSalary}
              onChange={e => setTargetSalary(Number(e.target.value))}
            />
            <span className="flow-wage-value">${targetSalary.toFixed(2)}/hr</span>
          </div>
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
    </section>
  )
}
