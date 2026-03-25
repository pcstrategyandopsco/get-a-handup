import { useState, useCallback } from 'react'
import type { EntitlementResult, IntakeAnswers, TransitionAnalysis } from '../../lib/types'
import type { TriageMode } from '../../engine/questions'
import { OutcomeSection } from './OutcomeSection'
import { TransitionSection } from './TransitionSection'

type Props = {
  results: EntitlementResult[]
  isEvaluating: boolean
  onSign: () => void
  isSigning: boolean
  alreadyReceiving: string[]
  triageMode: TriageMode
  onContinueFullAssessment: () => void
  answers: IntakeAnswers
  transitionAnalysis: TransitionAnalysis | null
}

function parseDollar(str?: string): number | null {
  if (!str) return null
  const m = str.match(/\$(\d[\d,]*\.?\d*)/)
  return m ? parseFloat(m[1].replace(/,/g, '')) : null
}

function sumAmounts(items: EntitlementResult[]): { total: number; hasUnknown: boolean } {
  let total = 0
  let hasUnknown = false
  for (const r of items) {
    const v = parseDollar(r.weekly_amount)
    if (v !== null) total += v
    else if (r.weekly_amount) hasUnknown = true
  }
  return { total, hasUnknown }
}

function fmt(n: number): string {
  return '$' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function toTypeKey(name: string): string {
  return name.toUpperCase().replace(/ /g, '_')
}

export function AssessmentScreen({ results, isEvaluating, onSign, isSigning, alreadyReceiving, triageMode, onContinueFullAssessment, answers, transitionAnalysis }: Props) {
  const receivingKeys = new Set(
    alreadyReceiving.filter(s => s !== 'None of these').map(toTypeKey)
  )

  const ACTIONABLE_THRESHOLD = 65
  const EMERGENCY_CATEGORIES = new Set(['hardship'])
  const EMERGENCY_FREQUENCIES = new Set(['one-off', 'as-needed'])

  const isEmergency = (r: EntitlementResult) =>
    EMERGENCY_CATEGORIES.has(r.category) || EMERGENCY_FREQUENCIES.has(r.frequency)

  const confirmed = results.filter(r => receivingKeys.has(r.entitlement_type))
  const missing = results.filter(r => !receivingKeys.has(r.entitlement_type))

  // Separate recurring entitlements from emergency/one-off provisions
  const missingRecurring = missing.filter(r => !isEmergency(r))
  const emergency = missing.filter(r => isEmergency(r))

  const entitled = missingRecurring.filter(r => r.status === 'ENTITLED')
  const actionable = missingRecurring.filter(r => r.status === 'POSSIBLE' && r.confidence >= ACTIONABLE_THRESHOLD)
  const contingency = missingRecurring.filter(r =>
    (r.status === 'POSSIBLE' && r.confidence < ACTIONABLE_THRESHOLD) ||
    r.status === 'INSUFFICIENT_INFORMATION'
  )

  const currentSum = sumAmounts(confirmed)
  const entitledSum = sumAmounts(entitled)
  const actionableSum = sumAmounts(actionable)
  const contingencySum = sumAmounts(contingency)
  const conservativeTotal = currentSum.total + entitledSum.total
  const fullTotal = conservativeTotal + actionableSum.total + contingencySum.total

  if (results.length === 0 && !isEvaluating) {
    return (
      <div className="assessment-screen">
        <div className="placeholder-state">
          No entitlements identified from the information provided.
        </div>
        {(triageMode === 'crisis' || triageMode === 'sanctions' || triageMode === 'appeal') && (
          <ContinueFullPrompt onContinue={onContinueFullAssessment} />
        )}
      </div>
    )
  }

  // Crisis / sanctions mode — focused layout
  if (triageMode === 'crisis' || triageMode === 'sanctions') {
    return (
      <div className="assessment-screen">
        <CrisisBanner mode={triageMode} answers={answers} />

        {results.length > 0 && (
          <section className="dash-section dash-delay-2">
            <div className="dash-section-header">
              <span className="dash-section-title dash-section-title--entitled">Emergency support available</span>
              <span className="dash-section-count">{results.length}</span>
            </div>
            <div className="dash-card-list">
              {results.map(r => (
                <EntitlementRow key={r.entitlement_type} result={r} />
              ))}
            </div>
          </section>
        )}

        {triageMode === 'sanctions' && (
          <SanctionsAdvocacy answers={answers} />
        )}

        <ContinueFullPrompt onContinue={onContinueFullAssessment} />

        <div className="dash-section dash-delay-7">
          <OutcomeSection results={results} />
        </div>
      </div>
    )
  }

  // Appeal mode — focused layout
  if (triageMode === 'appeal') {
    const appealTarget = String(answers['triage.appeal_benefit'] ?? '')

    return (
      <div className="assessment-screen">
        <section className="dash-section dash-delay-1">
          <div className="assessment-header">
            <div>
              <h2 className="assessment-title">Appeal assessment{isEvaluating ? ' (updating...)' : ''}</h2>
              <div className="assessment-meta">
                Declined benefit: {appealTarget || 'Unknown'}
              </div>
            </div>
            <button
              className="download-btn"
              onClick={onSign}
              disabled={isSigning || results.length === 0}
            >
              {isSigning ? 'Signing...' : 'Sign & generate document'}
            </button>
          </div>
        </section>

        <AppealGuidance benefitName={appealTarget} />

        {results.length > 0 && (
          <section className="dash-section dash-delay-3">
            <div className="dash-section-header">
              <span className="dash-section-title dash-section-title--entitled">Re-evaluation results</span>
              <span className="dash-section-count">{results.length}</span>
            </div>
            <div className="dash-card-list">
              {results.map(r => (
                <EntitlementRow key={r.entitlement_type} result={r} />
              ))}
            </div>
          </section>
        )}

        <ContinueFullPrompt onContinue={onContinueFullAssessment} />

        <div className="dash-section dash-delay-7">
          <OutcomeSection results={results} />
        </div>
      </div>
    )
  }

  // Full mode — unchanged from original
  return (
    <div className="assessment-screen">
      {/* ── Overview ── */}
      <section className="dash-section dash-delay-1">
        <div className="assessment-header">
          <div>
            <h2 className="assessment-title">Assessment{isEvaluating ? ' (updating...)' : ''}</h2>
            <div className="assessment-meta">
              {results.length} entitlement{results.length !== 1 ? 's' : ''} evaluated
              {missing.length > 0 && ` \u2022 ${missing.length} you may not be receiving`}
            </div>
          </div>
          <button
            className="download-btn"
            onClick={onSign}
            disabled={isSigning || results.length === 0}
          >
            {isSigning ? 'Signing...' : 'Sign & generate document'}
          </button>
        </div>

        <div className="dash-tiers">
          <div className="dash-tier">
            <span className="dash-tier-label">Current support</span>
            <span className="dash-tier-amount">{fmt(currentSum.total)}</span>
            <span className="dash-tier-detail">
              {confirmed.length} benefit{confirmed.length !== 1 ? 's' : ''}/wk
            </span>
          </div>
          <div className="dash-tier-arrow">{'\u25B8'}</div>
          <div className="dash-tier dash-tier--entitled">
            <span className="dash-tier-label">Conservative estimate</span>
            <span className="dash-tier-amount">{fmt(conservativeTotal)}</span>
            <span className="dash-tier-detail">
              +{entitled.length} entitled/wk
              {entitledSum.hasUnknown && ' + variable'}
            </span>
          </div>
          <div className="dash-tier-arrow">{'\u25B8'}</div>
          <div className="dash-tier dash-tier--full">
            <span className="dash-tier-label">Full potential</span>
            <span className="dash-tier-amount">{fmt(fullTotal)}</span>
            <span className="dash-tier-detail">
              +{actionable.length + contingency.length} possible/wk
              {(actionableSum.hasUnknown || contingencySum.hasUnknown) && ' + variable'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Current Support ── */}
      {confirmed.length > 0 && (
        <section className="dash-section dash-delay-2">
          <div className="dash-section-header">
            <span className="dash-section-title">Current support</span>
            <span className="dash-section-count">{confirmed.length}</span>
          </div>
          <p className="dash-section-desc">
            Benefits you reported receiving. Verify amounts match your payments.
          </p>
          <div className="dash-compact-list">
            {confirmed.map(r => (
              <div key={r.entitlement_type} className="dash-row dash-row--confirmed">
                <span className="dash-row-indicator confirmed-indicator" />
                <span className="dash-row-name">{r.name}</span>
                <span className="dash-row-amount">{r.weekly_amount ?? '\u2014'}</span>
                <span className="dash-row-status">Receiving</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── You should be receiving ── */}
      {entitled.length > 0 && (
        <section className="dash-section dash-delay-3">
          <div className="dash-section-header">
            <span className="dash-section-title dash-section-title--entitled">You should be receiving</span>
            <span className="dash-section-count">{entitled.length}</span>
          </div>
          <div className="dash-card-list">
            {entitled.map(r => (
              <EntitlementRow key={r.entitlement_type} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── Worth investigating ── */}
      {actionable.length > 0 && (
        <section className="dash-section dash-delay-4">
          <div className="dash-section-header">
            <span className="dash-section-title dash-section-title--possible">Worth investigating</span>
            <span className="dash-section-count">{actionable.length}</span>
          </div>
          <div className="dash-card-list">
            {actionable.map(r => (
              <EntitlementRow key={r.entitlement_type} result={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── Contingency — recurring entitlements that need more info ── */}
      {contingency.length > 0 && (
        <ContingencySection items={contingency} />
      )}

      {/* ── Emergency safety net — one-off / hardship provisions ── */}
      {emergency.length > 0 && (
        <EmergencySection items={emergency} />
      )}

      {/* ── Financial Summary ── */}
      <section className="dash-section dash-delay-6">
        <div className="dash-section-header">
          <span className="dash-section-title">Financial summary</span>
        </div>
        <div className="dash-summary">
          <SummaryRow
            label="Current weekly support"
            amount={currentSum.total}
            extra={currentSum.hasUnknown ? '+ variable' : undefined}
            tier="current"
          />
          <SummaryRow
            label="Conservative estimate"
            sublabel="Current + entitled benefits"
            amount={conservativeTotal}
            delta={entitledSum.total}
            extra={entitledSum.hasUnknown ? '+ variable' : undefined}
            tier="entitled"
          />
          <SummaryRow
            label="Full potential"
            sublabel="All identified entitlements"
            amount={fullTotal}
            delta={fullTotal - currentSum.total}
            extra={contingencySum.hasUnknown || entitledSum.hasUnknown ? '+ variable' : undefined}
            tier="full"
          />
        </div>
        <div className="dash-summary-note">
          Amounts are indicative maximums from published MSD rate tables.
          Actual amounts depend on income testing, abatement, and case assessment.
        </div>
      </section>

      {/* ── Transition analysis ── */}
      {transitionAnalysis && (
        <TransitionSection analysis={transitionAnalysis} answers={answers} />
      )}

      {/* ── Outcome logging ── */}
      <div className="dash-section dash-delay-8">
        <OutcomeSection results={missing} />
      </div>
    </div>
  )
}

// ── Collapsible entitlement row ──

function conditionStatus(result: EntitlementResult): 'met' | 'likely' | 'unknown' {
  if (result.status === 'ENTITLED') return 'met'
  if (result.status === 'POSSIBLE') return 'likely'
  return 'unknown'
}

const STATUS_ICON: Record<string, string> = { met: '\u2713', likely: '\u25CB', unknown: '?' }
const STATUS_TEXT: Record<string, string> = { met: 'Met', likely: 'Likely', unknown: 'Unverified' }

function EntitlementRow({ result }: { result: EntitlementResult }) {
  const [open, setOpen] = useState(false)
  const cls = result.status === 'ENTITLED' ? 'entitled' : result.status === 'POSSIBLE' ? 'possible' : 'unknown'
  const cStatus = conditionStatus(result)

  const hasDocs = result.documentation_required && result.documentation_required.length > 0
  const hasDeflection = result.deflection_patterns && result.deflection_patterns.length > 0
  const hasIssues = result.known_issues && result.known_issues.length > 0

  return (
    <div className={`dash-ent ${cls}${open ? ' dash-ent--open' : ''}`}>
      <button
        className="dash-ent-headline"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="dash-ent-name">{result.name}</span>
        <span className={`dash-ent-amount ${cls}`}>{result.weekly_amount ?? 'Variable'}</span>
        <span className={`dash-conf-badge ${cls}`}>{result.confidence}%</span>
        <span className={`dash-ent-chevron${open ? ' dash-ent-chevron--open' : ''}`}>{'\u25BE'}</span>
      </button>

      {open && (
        <div className="dash-ent-detail">
          {/* Policy intent + legal basis — compact top row */}
          <div className="dash-detail-header">
            {result.description && (
              <p className="dash-detail-desc">{result.description}</p>
            )}
            <span className="dash-detail-cite">{result.legal_basis}</span>
          </div>

          {/* Conditions — checklist with status indicators */}
          {result.conditions && result.conditions.length > 0 && (
            <div className="dash-detail-block">
              <span className="dash-detail-label">Eligibility conditions</span>
              <div className="dash-conditions">
                {result.conditions.map((c, i) => (
                  <div key={i} className={`dash-cond dash-cond--${cStatus}`}>
                    <span className={`dash-cond-icon dash-cond-icon--${cStatus}`}>
                      {STATUS_ICON[cStatus]}
                    </span>
                    <span className="dash-cond-text">{c}</span>
                    <span className={`dash-cond-badge dash-cond-badge--${cStatus}`}>
                      {STATUS_TEXT[cStatus]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friction — structured grid */}
          {(result.typical_processing || hasDocs || hasIssues) && (
            <div className="dash-detail-block">
              <span className="dash-detail-label">Application friction</span>
              <div className="dash-friction">
                {result.typical_processing && (
                  <div className="dash-friction-item">
                    <span className="dash-friction-icon">{'\u29D7'}</span>
                    <div className="dash-friction-content">
                      <span className="dash-friction-key">Processing time</span>
                      <span className="dash-friction-val">{result.typical_processing}</span>
                    </div>
                  </div>
                )}
                {hasDocs && result.documentation_required!.map((d, i) => (
                  <div key={i} className="dash-friction-item">
                    <span className="dash-friction-icon">{'\u2610'}</span>
                    <div className="dash-friction-content">
                      <span className="dash-friction-key">Required</span>
                      <span className="dash-friction-val">{d}</span>
                    </div>
                  </div>
                ))}
                {hasIssues && result.known_issues!.map((d, i) => (
                  <div key={i} className="dash-friction-item dash-friction-item--warn">
                    <span className="dash-friction-icon dash-friction-icon--warn">!</span>
                    <div className="dash-friction-content">
                      <span className="dash-friction-key">Known issue</span>
                      <span className="dash-friction-val">{d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deflection warning */}
          {hasDeflection && (
            <div className="dash-detail-block dash-detail-deflection">
              <span className="dash-detail-label">Deflection risk</span>
              {result.deflection_patterns!.map((d, i) => (
                <div key={i} className="dash-deflection-item">
                  <span className="dash-deflection-icon">!</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action */}
          <div className="dash-detail-block">
            <span className="dash-detail-label">At your appointment</span>
            <p className="dash-detail-action">{result.action}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Summary row ──

function SummaryRow({ label, sublabel, amount, delta, extra, tier }: {
  label: string
  sublabel?: string
  amount: number
  delta?: number
  extra?: string
  tier: 'current' | 'entitled' | 'full'
}) {
  return (
    <div className={`dash-summary-row dash-summary-row--${tier}`}>
      <div className="dash-summary-label-col">
        <span className="dash-summary-label">{label}</span>
        {sublabel && <span className="dash-summary-sublabel">{sublabel}</span>}
      </div>
      <div className="dash-summary-amount-col">
        <span className="dash-summary-amount">{fmt(amount)}/wk</span>
        {delta !== undefined && delta > 0 && (
          <span className="dash-summary-delta">+{fmt(delta)}{extra ? ` ${extra}` : ''}</span>
        )}
        {!delta && extra && (
          <span className="dash-summary-delta">{extra}</span>
        )}
      </div>
    </div>
  )
}

// ── Contingency section — collapsed by default ──

function ContingencySection({ items }: { items: EntitlementResult[] }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="dash-section dash-delay-5">
      <button
        className="dash-contingency-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="dash-section-title">If circumstances change</span>
        <span className="dash-section-count">{items.length}</span>
        <span className="dash-contingency-hint">
          Speculative entitlements needing more information
        </span>
        <span className={`dash-ent-chevron${open ? ' dash-ent-chevron--open' : ''}`}>{'\u25BE'}</span>
      </button>
      {open && (
        <div className="dash-contingency-list">
          {items.map(r => (
            <div key={r.entitlement_type} className="dash-contingency-row">
              <span className="dash-contingency-name">{r.name}</span>
              <span className="dash-contingency-amount">{r.weekly_amount ?? 'Variable'}</span>
              <span className={`dash-conf-badge ${r.status === 'POSSIBLE' ? 'possible' : 'unknown'}`}>
                {r.confidence}%
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Emergency safety net — collapsed by default ──

function EmergencySection({ items }: { items: EntitlementResult[] }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="dash-section dash-delay-5">
      <button
        className="dash-emergency-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="dash-section-title">Emergency safety net</span>
        <span className="dash-section-count">{items.length}</span>
        <span className="dash-contingency-hint">
          One-off grants and hardship provisions if you need them
        </span>
        <span className={`dash-ent-chevron${open ? ' dash-ent-chevron--open' : ''}`}>{'\u25BE'}</span>
      </button>
      {open && (
        <div className="dash-emergency-list">
          <p className="dash-emergency-note">
            These are not regular payments. They exist for emergencies — food, rent arrears,
            medical costs, moving. You can request them at any MSD office.
          </p>
          {items.map(r => (
            <EntitlementRow key={r.entitlement_type} result={r} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Crisis banner ──

function CrisisBanner({ mode, answers }: { mode: 'crisis' | 'sanctions'; answers: IntakeAnswers }) {
  const needs = (answers['triage.crisis_needs'] ?? []) as string[]

  return (
    <section className="dash-section dash-section--crisis dash-delay-1">
      <div className="crisis-banner">
        <div className="crisis-banner-content">
          <h2 className="assessment-title">
            {mode === 'crisis' ? 'Emergency support available' : 'Benefit sanction — your rights'}
          </h2>
          <div className="assessment-meta">
            {mode === 'crisis' && needs.length > 0 && (
              <>Identified needs: {needs.join(', ')}</>
            )}
            {mode === 'sanctions' && (
              <>These grants and payments may be available while your sanction is resolved.</>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Sanctions advocacy steps ──

function SanctionsAdvocacy({ answers }: { answers: IntakeAnswers }) {
  const notNotified = answers['triage.sanction_notified'] === 'No'
  const noWritten = answers['triage.sanction_written'] === 'No' || answers['triage.sanction_written'] === 'No reason given'

  return (
    <section className="dash-section dash-delay-4">
      <div className="dash-section-header">
        <span className="dash-section-title">Challenge the sanction</span>
      </div>
      <div className="advocacy-steps">
        {notNotified && (
          <div className="advocacy-step advocacy-step--warn">
            <span className="advocacy-step-num">!</span>
            <div className="advocacy-step-content">
              <span className="advocacy-step-title">Notification failure</span>
              <p>MSD must notify you before reducing or stopping your benefit (s117 Social Security Act 2018). If you were not notified, the sanction may be invalid. Request the notification record via OIA.</p>
            </div>
          </div>
        )}
        <div className="advocacy-step">
          <span className="advocacy-step-num">1</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">Request written decision</span>
            <p>Under s12 Social Security Act 2018, you have the right to a written decision with reasons. If you have not received one, request it immediately.</p>
          </div>
        </div>
        <div className="advocacy-step">
          <span className="advocacy-step-num">2</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">File a Review of Decision</span>
            <p>Under s391 Social Security Act 2018, you can request a review within 12 months. The review is free and independent of the original decision maker.</p>
          </div>
        </div>
        <div className="advocacy-step">
          <span className="advocacy-step-num">3</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">Get free advocacy support</span>
            <p>Contact your nearest Citizens Advice Bureau (0800 367 222) or Community Law Centre for free help with the review process.</p>
          </div>
        </div>
        {noWritten && (
          <div className="advocacy-step advocacy-step--warn">
            <span className="advocacy-step-num">!</span>
            <div className="advocacy-step-content">
              <span className="advocacy-step-title">No written reason provided</span>
              <p>You reported no written reason was given. This strengthens your review case. MSD cannot enforce a sanction without a lawful written decision.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Appeal guidance ──

function AppealGuidance({ benefitName }: { benefitName: string }) {
  return (
    <section className="dash-section dash-delay-2">
      <div className="dash-section-header">
        <span className="dash-section-title">Review of Decision</span>
      </div>
      <div className="advocacy-steps">
        <div className="advocacy-step">
          <span className="advocacy-step-num">1</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">Request written reasons</span>
            <p>If you have not received written reasons for the {benefitName} decline, request them under s12 Social Security Act 2018. MSD must provide these.</p>
          </div>
        </div>
        <div className="advocacy-step">
          <span className="advocacy-step-num">2</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">File Review of Decision</span>
            <p>Under s391, you can request a review within 12 months of the decision. The review is free. Ask for form "Review of Decision" at any MSD office or call 0800 559 009.</p>
          </div>
        </div>
        <div className="advocacy-step">
          <span className="advocacy-step-num">3</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">Gather supporting evidence</span>
            <p>Bring documentation that addresses the reasons given for the decline. The re-evaluation below shows whether our rules engine agrees with the decision.</p>
          </div>
        </div>
        <div className="advocacy-step">
          <span className="advocacy-step-num">4</span>
          <div className="advocacy-step-content">
            <span className="advocacy-step-title">Get free advocacy support</span>
            <p>Citizens Advice Bureau (0800 367 222) and Community Law Centres provide free help with benefit reviews and appeals.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Continue full assessment prompt ──

function ContinueFullPrompt({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="dash-section continue-full-prompt dash-delay-5">
      <p>This was a focused assessment based on your immediate need. A full assessment evaluates all 73 NZ government benefits.</p>
      <button className="continue-full-btn" onClick={onContinue}>
        Continue full assessment
      </button>
    </section>
  )
}
