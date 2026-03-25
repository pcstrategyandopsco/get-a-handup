// Shared types across client and server

export type EntitlementStatus = 'ENTITLED' | 'POSSIBLE' | 'INSUFFICIENT_INFORMATION'

export type OutcomeCode = 'GRANTED' | 'DENIED' | 'NOT_ASSESSED' | 'DEFERRED' | 'DEFLECTED'

export type Advocacy = {
  appointment_strategy?: string
  talking_points?: string[]
  common_objections?: Array<{
    objection: string
    counter: string
    cite?: string
  }>
  escalation_triggers?: Array<{
    trigger: string
    action: string
  }>
}

export type EntitlementResult = {
  entitlement_type: string
  name: string
  category: string
  frequency: string
  status: EntitlementStatus
  confidence: number         // 0-100
  legal_basis: string        // e.g. "s73 Social Security Act 2018"
  weekly_amount?: string     // e.g. "up to $305"
  action: string             // specific instruction for WINZ appointment
  conditions?: string[]              // from benefit.eligibility.conditions
  documentation_required?: string[]  // from benefit.friction.documentation_required
  deflection_patterns?: string[]     // from benefit.friction.deflection_patterns
  typical_processing?: string        // from benefit.friction.typical_processing
  known_issues?: string[]            // from benefit.friction.known_issues
  description?: string               // from benefit.description
  advocacy?: Advocacy                // from benefit.advocacy
}

export type SignedDocument = {
  version: string            // rules engine version e.g. "SSA-2024.Q4"
  generated: string          // ISO date only, no time
  circumstances: Record<string, unknown>
  entitlements: EntitlementResult[]
  brief: string              // plain-language appointment prep text
  signature: string          // ECDSA P-256 base64 — added after signing
  publicKey: string          // for browser-side verification
}

export type IntakeAnswers = Record<string, unknown>

export type OutcomePayload = {
  entitlement_type: string
  outcome_code: OutcomeCode
}

// Benefit dataset types (mirrors data/dist/types.ts)
export type RuleOp = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists' | 'not_exists'

export type Rule = {
  fact: string
  op: RuleOp
  value?: unknown
}

export type BenefitCategory = 'main' | 'supplement' | 'hardship' | 'housing' | 'family' | 'employment' | 'health' | 'residential' | 'other'
export type PaymentFrequency = 'weekly' | 'fortnightly' | 'one-off' | 'annual' | 'automatic' | 'as-needed'

export type Benefit = {
  id: string
  name: string
  category: BenefitCategory
  frequency: PaymentFrequency
  taxable: boolean
  legal_basis?: string
  source_url?: string
  description: string

  eligibility: {
    min_age?: number | null
    max_age?: number | null
    residency?: string[]
    residence_years?: number | null
    requires_benefit?: boolean
    benefit_types?: string[]
    requires_application?: boolean
    rules?: Rule[]
    conditions?: string[]
  }

  rates?: {
    effective?: string
    fixed_amount?: string
    max_weekly?: string
    max_fortnightly?: string
    max_annual?: string
    max_one_off?: string
    description?: string
  }

  income_test?: {
    applies?: boolean
    description?: string
  }

  asset_test?: {
    applies?: boolean
    single?: number
    couple_or_sole_parent?: number
    description?: string
  }

  friction?: {
    documentation_required?: string[]
    typical_processing?: string
    known_issues?: string[]
    deflection_patterns?: string[]
  }

  advocacy?: Advocacy
}

// ── Transition analysis types ──

export type IncomeScenario = {
  label: string
  gross_weekly: number
  tax_weekly: number
  acc_weekly: number
  benefit_weekly: number
  abatement_weekly: number
  supplements_weekly: number
  work_incentives_weekly: number
  net_weekly: number
  net_annual: number
  effective_tax_rate: number
}

export type StudyVerdict = 'better_studying' | 'marginal' | 'trap' | null

export type StudyROIVerdict = 'strong_return' | 'moderate_return' | 'long_payback' | 'net_loss'

export type StudyProjection = {
  target_hourly: number
  training_weeks: number
  job_search_weeks: number
  post_study_scenario: IncomeScenario
  study_phase_net: number
  breakeven_weeks: number | null
  five_year_gain: number
  roi_verdict: StudyROIVerdict
}

export type TransitionAnalysis = {
  current: IncomeScenario
  scenarios: IncomeScenario[]
  crossover_hourly_rate: number | null
  crossover_weekly_hours: number | null
  housing_cliff: number
  gains: string[]
  losses: string[]
  net_gain_at_fulltime: number
  verdict: 'better_working' | 'marginal' | 'trap'
  study_scenarios: IncomeScenario[]
  study_gains: string[]
  study_losses: string[]
  study_verdict: StudyVerdict
  study_projection: StudyProjection | null
}

export type RateData = {
  main_benefits: Record<string, Record<string, number>>
  accommodation_supplement: Record<string, Record<string, number>>
  abatement: Record<string, { threshold_weekly: number; rate: number }>
  tax_brackets: Array<{ threshold: number; rate: number }>
  acc_levy: number
  work_incentives: {
    in_work_tax_credit: { weekly: number; min_hours_single: number; min_hours_couple: number; requires_children: boolean; requires_off_benefit: boolean }
    independent_earner_tax_credit: { annual: number; income_min: number; income_max: number; requires_off_benefit: boolean }
    minimum_family_tax_credit: { annual_floor: number; requires_children: boolean; requires_off_benefit: boolean; min_hours_single: number; min_hours_couple: number }
    accommodation_benefit: { max_weekly: number; note: string }
  }
  studylink?: {
    student_allowance: Record<string, number>
    student_loan_living_costs: { weekly: number }
    accommodation_benefit: { max_weekly: number }
    course_related_costs?: { max_annual: number }
    training_incentive_allowance?: { annual_cap: number; weekly_equivalent: number }
  }
  [key: string]: unknown
}
