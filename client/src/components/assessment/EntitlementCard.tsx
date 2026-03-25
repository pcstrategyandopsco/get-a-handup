import type { EntitlementResult } from '../../lib/types'

type Props = {
  result: EntitlementResult
  alreadyReceiving?: boolean
}

export function EntitlementCard({ result, alreadyReceiving }: Props) {
  const cls =
    result.status === 'ENTITLED' ? 'entitled' :
    result.status === 'POSSIBLE' ? 'possible' : 'unknown'

  return (
    <div
      className={`entitlement-card ${cls}`}
      style={alreadyReceiving ? { opacity: 0.55 } : undefined}
    >
      <div className="card-top">
        <div className="card-name">{result.name ?? result.entitlement_type}</div>
        {result.weekly_amount && (
          <div className="card-amount">{result.weekly_amount}</div>
        )}
      </div>
      <div className="card-basis">{result.legal_basis}</div>
      {alreadyReceiving ? (
        <div className="card-action">You reported already receiving this payment.</div>
      ) : (
        <div className="card-action">{result.action}</div>
      )}
      <div className="confidence">
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${result.confidence}%` }}
          />
        </div>
        <span className="confidence-pct">{result.confidence}%</span>
      </div>
    </div>
  )
}
