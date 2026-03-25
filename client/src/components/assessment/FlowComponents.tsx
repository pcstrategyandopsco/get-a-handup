import type { ReactNode } from 'react'
import type { IncomeScenario } from '../../lib/types'

export type NodeVerdict = 'better' | 'marginal' | 'trap'

type WaterfallRow = {
  label: string
  amount: number
}

export function fmt(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString()
}

export function getNodeVerdict(net: number, currentNet: number): NodeVerdict {
  const diff = net - currentNet
  if (diff > 20) return 'better'
  if (diff >= -20) return 'marginal'
  return 'trap'
}

function verdictClass(v: NodeVerdict): string {
  return v === 'better' ? 'flow-node--better' : v === 'marginal' ? 'flow-node--marginal' : 'flow-node--trap'
}

function verdictLabel(v: NodeVerdict): string {
  return v === 'better' ? 'Better off' : v === 'marginal' ? 'Marginal' : 'Worse off'
}

function getWaterfallRows(s: IncomeScenario): WaterfallRow[] {
  const rows: WaterfallRow[] = []
  if (s.gross_weekly > 0) rows.push({ label: 'Wages', amount: s.gross_weekly })
  if (s.tax_weekly + s.acc_weekly > 0) rows.push({ label: 'Tax & ACC', amount: -(s.tax_weekly + s.acc_weekly) })
  if (s.abatement_weekly > 0) rows.push({ label: 'Abatement', amount: -s.abatement_weekly })
  if (s.benefit_weekly > 0) rows.push({ label: 'Benefit', amount: s.benefit_weekly })
  if (s.supplements_weekly > 0) rows.push({ label: 'Supplements', amount: s.supplements_weekly })
  if (s.work_incentives_weekly > 0) rows.push({ label: 'Tax credits', amount: s.work_incentives_weekly })
  return rows
}

const LAYOUT = {
  currentX: 50,
  currentY: 6,
  nodeWidth: 28,
  scenarioY: 55,
  scenarioXs: [17, 50, 83],
}

function Waterfall({ scenario }: { scenario: IncomeScenario }) {
  const rows = getWaterfallRows(scenario)
  if (rows.length === 0) return null

  return (
    <div className="flow-waterfall">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flow-waterfall-row ${row.amount >= 0 ? 'flow-waterfall-row--positive' : 'flow-waterfall-row--negative'}`}
        >
          <span className="flow-waterfall-label">{row.label}</span>
          <span className="flow-waterfall-amount">
            {row.amount >= 0 ? '+' : ''}{fmt(row.amount)}
          </span>
        </div>
      ))}
      <div className="flow-waterfall-total">
        <span className="flow-waterfall-label">You keep</span>
        <span className="flow-waterfall-amount">{fmt(scenario.net_weekly)}/wk</span>
      </div>
    </div>
  )
}

function FlowNode({
  scenario,
  isCurrent,
  verdict,
  extraClass,
  style,
}: {
  scenario: IncomeScenario
  isCurrent?: boolean
  verdict?: NodeVerdict
  extraClass?: string
  style?: React.CSSProperties
}) {
  const cls = [
    'flow-node',
    isCurrent ? 'flow-node--current' : '',
    verdict ? verdictClass(verdict) : '',
    extraClass ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} style={style}>
      <div className="flow-node-header">
        <span className="flow-node-label">{scenario.label}</span>
        {verdict && !isCurrent && (
          <span className={`flow-node-verdict flow-node-verdict--${verdict}`}>{verdictLabel(verdict)}</span>
        )}
      </div>
      <span className="flow-node-net">{fmt(scenario.net_weekly)}/wk</span>
      <Waterfall scenario={scenario} />
    </div>
  )
}

function EdgePath({
  fromX,
  toX,
  netChange,
  markerId,
}: {
  fromX: number
  toX: number
  netChange: number
  markerId: string
}) {
  const x1 = fromX * 10
  const y1 = 120
  const x2 = toX * 10
  const y2 = 240

  const midY = (y1 + y2) / 2
  const cp1y = y1 + 40
  const cp2y = y2 - 40

  const changeColor = netChange > 20 ? 'var(--green)' : netChange >= -20 ? 'var(--gold)' : 'var(--red)'
  const changeSign = netChange > 0 ? '+' : ''

  return (
    <g>
      <path
        d={`M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`}
        className="flow-edge-path"
        markerEnd={`url(#${markerId})`}
      />
      <foreignObject
        x={((x1 + x2) / 2) - 60}
        y={midY - 14}
        width={120}
        height={28}
      >
        <div className="flow-edge-label">
          <span className="flow-edge-change" style={{ color: changeColor }}>
            {changeSign}{fmt(netChange)}/wk
          </span>
        </div>
      </foreignObject>
    </g>
  )
}

// ── Shared layout for flow diagrams ──

type ScenarioNode = IncomeScenario & {
  extraClass?: string
}

type FlowDiagramLayoutProps = {
  id: string
  current: IncomeScenario
  scenarios: ScenarioNode[]
  header?: ReactNode
  verdict: ReactNode
}

const currentNodeStyle: React.CSSProperties = {
  position: 'absolute',
  left: `${LAYOUT.currentX}%`,
  top: `${LAYOUT.currentY + 6}%`,
  transform: 'translateX(-50%)',
  width: `${LAYOUT.nodeWidth}%`,
  minWidth: 220,
}

function scenarioNodeStyle(x: number): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${x}%`,
    top: `${LAYOUT.scenarioY + 6}%`,
    transform: 'translateX(-50%)',
    width: `${LAYOUT.nodeWidth}%`,
    minWidth: 220,
  }
}

export function FlowDiagramLayout({ id, current, scenarios, header, verdict }: FlowDiagramLayoutProps) {
  const markerId = `flow-arrow-${id}`

  return (
    <div className="flow-container">
      {header}

      <FlowNode scenario={current} isCurrent style={currentNodeStyle} />

      <svg
        className="flow-edges-svg"
        viewBox="0 0 1000 440"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border2)" />
          </marker>
        </defs>
        {scenarios.map((s, i) => {
          const toX = LAYOUT.scenarioXs[i] ?? LAYOUT.scenarioXs[0]
          return (
            <EdgePath
              key={i}
              fromX={LAYOUT.currentX}
              toX={toX}
              netChange={s.net_weekly - current.net_weekly}
              markerId={markerId}
            />
          )
        })}
      </svg>

      {scenarios.map((s, i) => {
        const x = LAYOUT.scenarioXs[i] ?? LAYOUT.scenarioXs[0]
        const nodeVerdict = getNodeVerdict(s.net_weekly, current.net_weekly)
        return (
          <FlowNode
            key={i}
            scenario={s}
            verdict={nodeVerdict}
            extraClass={s.extraClass}
            style={scenarioNodeStyle(x)}
          />
        )
      })}

      <div className="flow-verdict-summary">{verdict}</div>
    </div>
  )
}
