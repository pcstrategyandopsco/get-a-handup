import { useState } from 'react'
import type { SignedDocument, EntitlementResult, Advocacy } from '../../lib/types'
import { downloadDocument } from '../../hooks/useDocumentSigning'

type Props = {
  document: SignedDocument
}

// Labels for intake answer keys — filter noise, show meaningful facts
const CIRCUMSTANCE_LABELS: Record<string, string> = {
  'personal.age': 'Age',
  'personal.residency': 'Residency',
  'personal.years_in_nz': 'Years in NZ',
  'personal.relationship': 'Relationship',
  'personal.partner_income': 'Partner weekly income',
  'housing.type': 'Housing',
  'housing.cost': 'Weekly housing cost',
  'housing.region': 'Region',
  'housing.social_housing': 'Social housing',
  'housing.arrears': 'Rent arrears',
  'housing.need_to_move': 'Needs to move',
  'income.employed': 'Employed',
  'income.hours': 'Weekly hours',
  'income.amount': 'Weekly income',
  'income.benefit': 'On benefit',
  'income.benefit_type': 'Benefit type',
  'income.assets': 'Assets',
  'health.condition': 'Health condition',
  'health.duration': 'Condition duration',
  'health.costs': 'Health-related costs',
  'health.hours_able': 'Work capacity',
  'children.dependent': 'Dependent children',
  'children.count': 'Number of children',
  'children.ages': 'Child ages',
  'education.studying': 'Studying',
  'education.level': 'Study level',
  'education.load': 'Study load',
  'situation.emergency': 'Emergency',
  'situation.family_violence': 'Family violence',
  'situation.recently_released': 'Recently released',
  'situation.refugee': 'Refugee/protected person',
  'situation.carer': 'Full-time carer',
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function AdvocacySection({ advocacy }: { advocacy: Advocacy }) {
  const hasTalkingPoints = advocacy.talking_points && advocacy.talking_points.length > 0
  const hasObjections = advocacy.common_objections && advocacy.common_objections.length > 0
  const hasEscalation = advocacy.escalation_triggers && advocacy.escalation_triggers.length > 0

  if (!hasTalkingPoints && !hasObjections && !hasEscalation && !advocacy.appointment_strategy) {
    return null
  }

  return (
    <div className="doc-advocacy">
      <div className="doc-advocacy-label">Appointment playbook:</div>

      {advocacy.appointment_strategy && (
        <div className="doc-advocacy-strategy">{advocacy.appointment_strategy}</div>
      )}

      {hasTalkingPoints && (
        <div className="doc-talking-points">
          <div className="doc-talking-points-label">What to say:</div>
          <ol>
            {advocacy.talking_points!.map((point, i) => <li key={i}>{point}</li>)}
          </ol>
        </div>
      )}

      {hasObjections && (
        <div className="doc-objections">
          {advocacy.common_objections!.map((obj, i) => (
            <div key={i} className="doc-objection">
              <div className="doc-objection-quote">If they say: "{obj.objection}"</div>
              <div className="doc-objection-counter">You say: "{obj.counter}"</div>
              {obj.cite && <span className="doc-objection-cite">{obj.cite}</span>}
            </div>
          ))}
        </div>
      )}

      {hasEscalation && (
        <div className="doc-escalation">
          <div className="doc-escalation-label">If they won't budge:</div>
          {advocacy.escalation_triggers!.map((esc, i) => (
            <div key={i} className="doc-escalation-item">
              <div className="doc-escalation-trigger">{esc.trigger}</div>
              <div className="doc-escalation-action">{esc.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EntitlementDetail({ e }: { e: EntitlementResult }) {
  const statusClass = e.status === 'ENTITLED' ? 'entitled' : 'possible'
  return (
    <div className={`doc-entitlement-detail ${statusClass}`}>
      <div className="doc-ent-header">
        <span className="doc-ent-name">{e.name}</span>
        {e.weekly_amount && <span className="doc-ent-amount">{e.weekly_amount}</span>}
      </div>
      {e.legal_basis && <div className="doc-ent-basis">{e.legal_basis}</div>}
      <div className="doc-ent-action">{e.action}</div>

      {e.documentation_required && e.documentation_required.length > 0 && (
        <div className="doc-docs-list">
          <div className="doc-docs-label">Bring:</div>
          <ul>
            {e.documentation_required.map((doc, i) => <li key={i}>{doc}</li>)}
          </ul>
        </div>
      )}

      {e.deflection_patterns && e.deflection_patterns.length > 0 && (
        <div className="doc-deflection">
          <div className="doc-deflection-label">Watch for:</div>
          <ul>
            {e.deflection_patterns.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {e.advocacy && <AdvocacySection advocacy={e.advocacy} />}
    </div>
  )
}

export function DocumentScreen({ document: doc }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)
  const entitled = doc.entitlements.filter(e => e.status === 'ENTITLED')
  const possible = doc.entitlements.filter(e => e.status === 'POSSIBLE')

  // Filter circumstances to meaningful answers only
  const circumstances = Object.entries(doc.circumstances)
    .filter(([key]) => key in CIRCUMSTANCE_LABELS)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      label: CIRCUMSTANCE_LABELS[key],
      value: formatValue(value),
    }))

  // Deduplicate legal references
  const legalRefs = [...new Set(
    doc.entitlements
      .map(e => e.legal_basis)
      .filter((b): b is string => !!b && b.length > 0)
  )]

  return (
    <div className="document-screen">
      <div className="document-toolbar">
        <button
          className="download-btn"
          disabled={isDownloading}
          onClick={async () => {
            setIsDownloading(true)
            try {
              await downloadDocument(doc)
            } finally {
              setIsDownloading(false)
            }
          }}
        >
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      <div className="document-output">
        <div className="doc-title">ENTITLEMENT ASSESSMENT — APPOINTMENT BRIEF</div>
        <div className="doc-meta">
          <div className="doc-line">Version: {doc.version}</div>
          <div className="doc-line">Generated: {doc.generated}</div>
        </div>

        {/* NOTICE TO CASE MANAGER */}
        <div className="doc-notice">
          <div className="doc-section-title">NOTICE TO CASE MANAGER</div>
          <p>
            This is a structured entitlement assessment with statutory citations prepared
            under the Social Security Act 2018. The person presenting this document has
            identified potential entitlements based on their circumstances.
          </p>
          <p>
            If any entitlement identified below is declined, a written decision with
            specific legal reasons will be requested under s12 SSA 2018.
          </p>
          <p>
            This document is cryptographically signed and timestamped.
          </p>
        </div>

        {/* CIRCUMSTANCES */}
        {circumstances.length > 0 && (
          <div className="doc-section">
            <div className="doc-section-title">CIRCUMSTANCES</div>
            <div className="doc-circumstance-grid">
              {circumstances.map(({ label, value }) => (
                <div key={label} className="doc-line">
                  <span className="doc-line-key">{label}</span>
                  <span className="doc-line-val">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ENTITLEMENTS — ENTITLED */}
        {entitled.length > 0 && (
          <div className="doc-section">
            <div className="doc-section-title entitled-title">ENTITLEMENTS — ENTITLED</div>
            {entitled.map(e => (
              <EntitlementDetail key={e.entitlement_type} e={e} />
            ))}
          </div>
        )}

        {/* ENTITLEMENTS — POSSIBLE */}
        {possible.length > 0 && (
          <div className="doc-section">
            <div className="doc-section-title possible-title">ENTITLEMENTS — POSSIBLE</div>
            {possible.map(e => (
              <EntitlementDetail key={e.entitlement_type} e={e} />
            ))}
          </div>
        )}

        {/* IF DECLINED */}
        <div className="doc-rights">
          <div className="doc-section-title">IF ANY ENTITLEMENT IS DECLINED</div>
          <ol>
            <li>Request the decision in writing with specific legal reasons</li>
            <li>File a Review of Decision under s12 Social Security Act 2018</li>
            <li>File an online complaint at msd.govt.nz</li>
            <li>Contact Community Law or Citizens Advice Bureau for free advocacy</li>
            <li>Contact your Member of Parliament's office</li>
          </ol>
        </div>

        {/* LEGAL REFERENCES */}
        {legalRefs.length > 0 && (
          <div className="doc-legal-refs">
            <div className="doc-section-title">LEGAL REFERENCES</div>
            <ul>
              {legalRefs.map((ref, i) => <li key={i}>{ref}</li>)}
            </ul>
          </div>
        )}

        {/* SIGNATURE */}
        <div className="doc-signature">
          <div className="doc-line">
            SIGNATURE: <span className="sig-val">{doc.signature.slice(0, 48)}...</span>
          </div>
        </div>

        <div className="doc-exit-line">
          Use this to get what you are owed. Then move on.
        </div>
      </div>

    </div>
  )
}
