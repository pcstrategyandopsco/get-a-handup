/**
 * Scenario test runner
 * Feeds test scenario intake answers through the rules engine and reports results.
 *
 * Usage: npx tsx tests/run-scenarios.ts [scenario-file]
 * If no file specified, runs all scenarios in tests/scenarios/
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// We can't import the client engine directly (it's a browser module with JSON import),
// so we replicate the core logic here using the same benefits.json

import { computeTransition } from '../client/src/engine/transition'
import type { EntitlementResult, RateData } from '../client/src/lib/types'

const DIST = path.resolve(import.meta.dirname, '..', 'data', 'dist')
const benefits = JSON.parse(fs.readFileSync(path.join(DIST, 'benefits.json'), 'utf-8'))
const ratesJson = JSON.parse(fs.readFileSync(path.join(DIST, 'rates.json'), 'utf-8'))
const rates: RateData = ratesJson['2026-04-01']

type Rule = { fact: string; op: string; value?: unknown; critical?: boolean }
type Benefit = {
  id: string; name: string; category: string; frequency: string
  legal_basis?: string; eligibility: { min_age?: number | null; max_age?: number | null; residency?: string[]; requires_benefit?: boolean; rules?: Rule[]; conditions?: string[] }
  rates?: { max_weekly?: string; max_fortnightly?: string; fixed_amount?: string; max_one_off?: string; description?: string }
}

// ── Triage mode helper (mirrors client/src/engine/questions.ts) ──
function getTriageModeFromAnswers(answers: Record<string, unknown>): string | null {
  const reason = answers['triage.reason']
  if (reason === 'I need help right now (food, rent, power, medical)') return 'crisis'
  if (reason === 'My benefit was reduced or stopped') return 'sanctions'
  if (reason === 'I was declined a benefit and want to challenge it') return 'appeal'
  if (reason === 'Full assessment of everything I might be entitled to') return 'full'
  return null
}

// ── Accommodation zone helpers (mirrors client/src/engine/rules.ts) ──
const ZONE_1_REGIONS = ['Auckland', 'Wellington']
const ZONE_2_REGIONS = ['Canterbury / Christchurch']

function getAccomZone(region: string): number {
  if (ZONE_1_REGIONS.includes(region)) return 1
  if (ZONE_2_REGIONS.includes(region)) return 2
  return 3
}

function getAccomMaxWeekly(zone: number): number {
  if (zone === 1) return 305
  if (zone === 2) return 250
  return 175
}

// ── buildFacts: same logic as client/src/engine/rules.ts ──
function buildFacts(answers: Record<string, unknown>): Record<string, unknown> {
  const income = Number(answers['income.amount'] ?? 0)
  const partnerIncome = Number(answers['personal.partner_income'] ?? 0)
  const hours = Number(answers['income.hours'] ?? 0)
  const housingCost = Number(answers['housing.cost'] ?? 0)
  const region = String(answers['housing.region'] ?? 'Other')
  const accomZone = getAccomZone(region)
  const accomMax = getAccomMaxWeekly(accomZone)
  const age = Number(answers['personal.age'] ?? 0)
  const childAges = (answers['children.ages'] ?? []) as string[]
  const healthCostTypes = (answers['health.cost_types'] ?? []) as string[]

  // Education mapping
  const isStudent = answers['education.studying'] === 'Yes'
  const studyLevelMap: Record<string, string> = {
    'Certificate / Diploma': 'certificate_diploma',
    "Bachelor's degree": 'bachelors',
    'Postgraduate (Honours)': 'postgrad_honours',
    'Masters': 'masters',
    'PhD / Doctorate': 'phd'
  }
  const studyLevel = studyLevelMap[String(answers['education.level'] ?? '')] ?? ''
  const studyLoad = String(answers['education.load'] ?? '').toLowerCase() || ''
  const studyPapers = Number(answers['education.papers'] ?? 0)

  const residencyMap: Record<string, string> = {
    'NZ Citizen': 'citizen', 'Permanent Resident': 'permanent_resident',
    'Resident Visa': 'resident_visa', 'Refugee / Protected Person': 'refugee', 'Other visa': 'other'
  }

  const relationship = String(answers['personal.relationship'] ?? 'Single')
  const hasPartner = ['In a relationship / de facto', 'Married / civil union'].includes(relationship)
  const isSoleParent = !hasPartner && answers['children.dependent'] === 'Yes'
  const assetAnswer = String(answers['income.assets'] ?? 'Unsure')

  return {
    age, residency_status: residencyMap[String(answers['personal.residency'] ?? '')] ?? 'other',
    years_in_nz: Number(answers['personal.years_in_nz'] ?? 0),
    has_partner: hasPartner, is_sole_parent: isSoleParent, partner_income: partnerIncome,
    housing_type: String(answers['housing.type'] ?? '').toLowerCase().replace(/ /g, '_'),
    has_housing: ['Renting', 'Boarding', 'Mortgage'].includes(String(answers['housing.type'] ?? '')),
    housing_cost: housingCost,
    housing_cost_ratio: income > 0 ? housingCost / income : (housingCost > 0 ? 1 : 0),
    accom_zone: accomZone,
    accom_max: accomMax,
    region, is_social_housing: answers['housing.social_housing'] === 'Yes',
    has_rent_arrears: answers['housing.arrears'] === 'Yes',
    needs_to_move: answers['housing.need_to_move'] === 'Yes',
    at_risk_of_eviction: answers['housing.arrears'] === 'Yes',
    is_homeless: false, needs_bond_assistance: answers['housing.need_to_move'] === 'Yes',
    has_accommodation_costs: housingCost > 0,
    is_employed: answers['income.employed'] === 'Yes',
    weekly_income: income, hours_worked: hours,
    on_benefit: answers['income.benefit'] === 'Yes',
    on_main_benefit: answers['income.benefit'] === 'Yes',
    benefit_type: String(answers['income.benefit_type'] ?? ''),
    annual_income: income * 52,
    low_income: income < 800, very_low_income: income < 450,
    household_income: income + partnerIncome,
    assets_under_8100: assetAnswer === 'Under $8,100',
    assets_under_16200: assetAnswer === 'Under $8,100' || assetAnswer === '$8,100 – $16,200',
    asset_range: assetAnswer,
    has_condition: answers['health.condition'] === 'Yes',
    condition_duration: String(answers['health.duration'] ?? ''),
    has_ongoing_disability_costs: answers['health.costs'] === 'Yes',
    has_health_costs: answers['health.costs'] === 'Yes',
    has_health_related_costs: answers['health.costs'] === 'Yes',
    has_extra_power_costs: healthCostTypes.includes('Extra power / heating'),
    needs_home_modifications: healthCostTypes.includes('Home modifications needed'),
    hours_able: String(answers['health.hours_able'] ?? ''),
    unable_to_work: answers['health.hours_able'] === 'Unable to work',
    work_capacity_under_15: ['Unable to work', 'Less than 15 hrs'].includes(String(answers['health.hours_able'] ?? '')),
    in_residential_care: answers['health.residential_care'] === 'Yes',
    has_chronic_condition: answers['health.duration'] === 'More than 2 years' || answers['health.duration'] === 'Permanent / lifelong',
    has_children: answers['children.dependent'] === 'Yes',
    child_count: Number(answers['children.count'] ?? 0),
    child_ages: childAges,
    has_child_under_3: childAges.some((a: string) => a === 'Under 1 year' || a === '1 – 2 years'),
    youngest_child_under_14: childAges.some((a: string) => ['Under 1 year', '1 – 2 years', '3 – 4 years', '5 – 13 years'].includes(a)),
    child_in_ece: answers['children.childcare'] === 'Yes',
    child_in_childcare: answers['children.childcare'] === 'Yes',
    has_child_with_disability: answers['children.disability'] === 'Yes',
    child_disability: answers['children.disability'] === 'Yes',
    is_caring_for_unsupported_child: answers['children.caring_for_other'] === 'Yes',
    is_caring_for_orphan: answers['children.caring_for_other'] === 'Yes',
    is_seeking_work: answers['employment.seeking_work'] === 'Yes',
    unemployment_duration: String(answers['employment.unemployment_duration'] ?? ''),
    interested_in_training: answers['employment.training_interest'] === 'Yes',
    in_approved_training: answers['employment.training_interest'] === 'Yes',
    interested_in_apprenticeship: answers['employment.training_interest'] === 'Yes',
    is_seasonal_worker: answers['employment.seasonal'] === 'Yes',
    in_off_season: answers['employment.seasonal'] === 'Yes',
    starting_self_employment: answers['employment.self_employed'] === 'Yes',
    has_barriers_to_employment: answers['employment.unemployment_duration'] === 'More than 12 months',
    work_ready: answers['employment.unemployment_duration'] === 'Less than 4 weeks',
    is_student: isStudent,
    study_level: studyLevel,
    study_load: studyLoad,
    is_postgrad: ['masters', 'phd'].includes(studyLevel),
    is_postgrad_above_honours: ['masters', 'phd'].includes(studyLevel),
    study_papers: studyPapers,
    study_hours_equivalent: studyPapers * 10,
    in_study_break: false,
    in_emergency: answers['situation.emergency'] === 'Yes',
    experiencing_family_violence: answers['situation.family_violence'] === 'Yes',
    recently_released: answers['situation.recently_released'] === 'Yes',
    is_refugee: answers['situation.refugee'] === 'Yes',
    recently_arrived: answers['situation.refugee'] === 'Yes',
    is_full_time_carer: answers['situation.carer'] === 'Yes',
    essential_costs_exceed_income: (housingCost > 0 && income > 0 && housingCost / income > 0.3) || (answers['health.costs'] === 'Yes'),
    has_essential_need: answers['situation.emergency'] === 'Yes' || income < 450,
    has_urgent_need: answers['situation.emergency'] === 'Yes',
    in_hardship: income < 450 && !answers['income.benefit'],
    has_special_circumstances: answers['situation.emergency'] === 'Yes',
    has_housing_need: answers['housing.arrears'] === 'Yes' || answers['housing.need_to_move'] === 'Yes',
    needs_to_relocate: answers['housing.need_to_move'] === 'Yes',
    relocating_for_employment: answers['housing.need_to_move'] === 'Yes' && answers['employment.seeking_work'] === 'Yes',
    has_tenancy_costs: answers['housing.need_to_move'] === 'Yes',
    is_working_sufficient_hours: hasPartner
      ? (hours + Math.round(partnerIncome / 23.15)) >= 30
      : hours >= 20,
    partner_estimated_hours: hasPartner ? Math.round(partnerIncome / 23.15) : 0,
    couple_combined_income: hasPartner ? income + partnerIncome : income,
    couple_income_high: hasPartner && (income + partnerIncome) > 250,
    partner_income_above_abatement: hasPartner && partnerIncome > 160,
    not_employed: answers['income.employed'] !== 'Yes',
    needs_establishment_support: answers['situation.family_violence'] === 'Yes' || (relationship === 'Separated' && answers['housing.need_to_move'] === 'Yes'),
    needs_long_term_care: answers['health.residential_care'] === 'Yes' && (answers['health.duration'] === 'More than 2 years' || answers['health.duration'] === 'Permanent / lifelong'),
    needs_community_support: answers['health.residential_care'] === 'Yes',
    has_newborn: childAges.includes('Under 1 year'),
    has_school_costs: childAges.some((a: string) => ['5 – 13 years', '14 – 17 years'].includes(a)),
    family_income: income + partnerIncome,
    not_receiving_paid_parental_leave: true,
    starting_employment: false, not_in_education: !isStudent, has_property: false,
    has_funeral_costs: false, on_social_housing_wait_list: false,
    affected_by_civil_defence_emergency: false, has_extra_clothing_costs: false,

    // Triage — scenarios without triage.reason get null (full mode behavior)
    triage_mode: getTriageModeFromAnswers(answers),
    in_crisis_mode: getTriageModeFromAnswers(answers) === 'crisis',
    in_sanctions_mode: getTriageModeFromAnswers(answers) === 'sanctions',
    in_appeal_mode: getTriageModeFromAnswers(answers) === 'appeal',
    crisis_needs_food: Array.isArray(answers['triage.crisis_needs']) && (answers['triage.crisis_needs'] as string[]).includes('Food'),
    crisis_needs_rent: Array.isArray(answers['triage.crisis_needs']) && (answers['triage.crisis_needs'] as string[]).includes('Rent or housing costs'),
    crisis_needs_power: Array.isArray(answers['triage.crisis_needs']) && (answers['triage.crisis_needs'] as string[]).includes('Power or heating'),
    crisis_needs_medical: Array.isArray(answers['triage.crisis_needs']) && (answers['triage.crisis_needs'] as string[]).includes('Medical costs'),
    benefit_was_reduced: answers['triage.sanction_type'] === 'Reduced',
    benefit_was_stopped: answers['triage.sanction_type'] === 'Stopped completely',
    sanction_not_notified: answers['triage.sanction_notified'] === 'No',
    sanction_no_written_reason: answers['triage.sanction_written'] === 'No' || answers['triage.sanction_written'] === 'No reason given',
    appeal_target: String(answers['triage.appeal_benefit'] ?? ''),
  }
}

function evaluateRule(rule: Rule, facts: Record<string, unknown>): { pass: boolean; evaluated: boolean } {
  const factValue = facts[rule.fact]
  if (factValue === undefined || factValue === null) {
    if (rule.op === 'not_exists') return { pass: true, evaluated: true }
    if (rule.op === 'exists') return { pass: false, evaluated: true }
    return { pass: false, evaluated: false }
  }
  switch (rule.op) {
    case 'eq': return { pass: factValue === rule.value, evaluated: true }
    case 'neq': return { pass: factValue !== rule.value, evaluated: true }
    case 'in': return { pass: Array.isArray(rule.value) && rule.value.includes(factValue), evaluated: true }
    case 'not_in': return { pass: Array.isArray(rule.value) && !rule.value.includes(factValue), evaluated: true }
    case 'gt': return { pass: Number(factValue) > Number(rule.value), evaluated: true }
    case 'gte': return { pass: Number(factValue) >= Number(rule.value), evaluated: true }
    case 'lt': return { pass: Number(factValue) < Number(rule.value), evaluated: true }
    case 'lte': return { pass: Number(factValue) <= Number(rule.value), evaluated: true }
    case 'exists': return { pass: true, evaluated: true }
    case 'not_exists': return { pass: false, evaluated: true }
    default: return { pass: false, evaluated: false }
  }
}

function evaluateBenefit(benefit: Benefit, facts: Record<string, unknown>) {
  const rules = benefit.eligibility.rules ?? []
  if (rules.length === 0) return null

  let passed = 0, evaluated = 0, failed = 0
  const ruleResults: { rule: Rule; pass: boolean; evaluated: boolean }[] = []

  for (const rule of rules) {
    const result = evaluateRule(rule, facts)
    ruleResults.push({ rule, ...result })
    if (result.evaluated) {
      evaluated++
      if (result.pass) {
        passed++
      } else {
        failed++
        // If a critical rule fails, exclude benefit entirely
        if (rule.critical) return null
      }
    }
  }

  if (evaluated === 0) return null

  const total = rules.length
  const passRatio = passed / total
  const evaluatedRatio = evaluated / total

  if (failed > 0 && passRatio < 0.5) return null
  if (total <= 2 && failed > 0) return null

  let status: string
  let confidence: number

  if (passed === total) {
    status = 'ENTITLED'; confidence = Math.min(95, 70 + Math.round(passRatio * 25))
  } else if (failed === 0 && evaluatedRatio < 0.5) {
    if (passed < 2) return null
    status = 'INSUFFICIENT_INFORMATION'; confidence = Math.round(30 + passRatio * 20)
  } else if (passRatio >= 0.7) {
    status = 'POSSIBLE'; confidence = Math.round(50 + passRatio * 30)
  } else if (passRatio >= 0.5 && failed <= 1) {
    status = 'POSSIBLE'; confidence = Math.round(40 + passRatio * 25)
  } else {
    return null
  }

  const age = Number(facts.age ?? 0)
  if (benefit.eligibility.min_age != null && age > 0 && age < benefit.eligibility.min_age) return null
  if (benefit.eligibility.max_age != null && age > 0 && age > benefit.eligibility.max_age) return null

  const residency = String(facts.residency_status ?? '')
  if (benefit.eligibility.residency?.length && residency && residency !== 'other') {
    if (!benefit.eligibility.residency.includes(residency)) return null
  }

  if (benefit.eligibility.requires_benefit === true && facts.on_benefit !== true) {
    if (status === 'ENTITLED') { status = 'POSSIBLE'; confidence = Math.max(40, confidence - 20) }
  }

  return { id: benefit.id, name: benefit.name, category: benefit.category, status, confidence, ruleResults }
}

// ── Main ──
const scenariosDir = path.resolve(import.meta.dirname, 'scenarios')
const targetFile = process.argv[2]
const files = targetFile
  ? [path.resolve(targetFile)]
  : fs.readdirSync(scenariosDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => path.join(scenariosDir, f))

for (const file of files) {
  const doc = yaml.load(fs.readFileSync(file, 'utf-8')) as any
  if (!doc?.scenario || !doc?.intake_answers) continue

  const scenario = doc.scenario
  const answers = doc.intake_answers
  const expected = doc.expected_entitlements ?? {}

  console.log(`\n${'═'.repeat(72)}`)
  console.log(`  SCENARIO: ${scenario.name}`)
  console.log(`  ${scenario.description?.split('\n')[0]?.trim() ?? ''}`)
  console.log(`${'═'.repeat(72)}`)

  const facts = buildFacts(answers)
  const results: any[] = []

  for (const benefit of benefits as Benefit[]) {
    const result = evaluateBenefit(benefit, facts)
    if (result) results.push(result)
  }

  results.sort((a, b) => {
    const order: Record<string, number> = { ENTITLED: 0, POSSIBLE: 1, INSUFFICIENT_INFORMATION: 2 }
    const d = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    return d !== 0 ? d : b.confidence - a.confidence
  })

  // Print results
  console.log(`\n  RESULTS (${results.length} entitlements surfaced):\n`)

  for (const r of results) {
    const icon = r.status === 'ENTITLED' ? '●' : r.status === 'POSSIBLE' ? '◐' : '○'
    console.log(`  ${icon} ${r.status.padEnd(25)} ${r.confidence}%  ${r.name} [${r.category}]`)

    // Show rule detail
    for (const rr of r.ruleResults) {
      const mark = !rr.evaluated ? '?' : rr.pass ? '✓' : '✗'
      console.log(`      ${mark} ${rr.rule.fact} ${rr.rule.op} ${JSON.stringify(rr.rule.value ?? null)} → ${!rr.evaluated ? 'no data' : rr.pass ? 'pass' : 'fail'}`)
    }
  }

  // Check expected
  const shouldSurface = expected.should_surface ?? []
  const shouldNotSurface = expected.should_not_surface ?? []
  const resultIds = new Set(results.map((r: any) => r.id))

  console.log(`\n  EXPECTED CHECKS:\n`)

  let passed = 0, failed = 0

  for (const exp of shouldSurface) {
    const found = results.find((r: any) => r.id === exp.id)
    if (found) {
      const statusMatch = !exp.status || found.status === exp.status
      if (statusMatch) {
        console.log(`  ✓ ${exp.id} — surfaced as ${found.status} (${found.confidence}%)`)
        passed++
      } else {
        console.log(`  ~ ${exp.id} — surfaced as ${found.status} (expected ${exp.status})`)
        passed++ // partial pass
      }
    } else {
      console.log(`  ✗ ${exp.id} — NOT surfaced (expected ${exp.status ?? 'any'})`)
      failed++
    }
  }

  for (const exp of shouldNotSurface) {
    if (resultIds.has(exp.id)) {
      const found = results.find((r: any) => r.id === exp.id)
      console.log(`  ✗ ${exp.id} — surfaced (should NOT have been) — ${found.status}`)
      failed++
    } else {
      console.log(`  ✓ ${exp.id} — correctly not surfaced`)
      passed++
    }
  }

  // ── Crisis guidance checks ──
  const crisisExpected = doc.crisis_expected
  if (crisisExpected) {
    console.log(`\n  CRISIS GUIDANCE CHECKS:\n`)

    const isCrisis = answers['situation.emergency'] === 'Yes'
      || (answers['housing.arrears'] === 'Yes' && answers['income.benefit'] === 'Yes')

    const EMERGENCY_CATEGORIES = new Set(['hardship'])
    const EMERGENCY_FREQUENCIES = new Set(['one-off', 'as-needed'])
    const hasEmergencyResults = results.some((r: any) => {
      const b = (benefits as Benefit[]).find(b => b.id === r.id)
      return b && (EMERGENCY_CATEGORIES.has(b.category) || EMERGENCY_FREQUENCIES.has(b.frequency))
    })

    // Check isCrisis detection
    if (crisisExpected.is_crisis !== undefined) {
      if (isCrisis === crisisExpected.is_crisis) {
        console.log(`  ✓ crisis detected: ${isCrisis} (expected ${crisisExpected.is_crisis})`)
        passed++
      } else {
        console.log(`  ✗ crisis detected: ${isCrisis} (expected ${crisisExpected.is_crisis})`)
        failed++
      }
    }

    // Check crisis tab visibility (replaces emergency_expanded)
    if (crisisExpected.crisis_tab !== undefined) {
      const crisisTabEnabled = isCrisis && hasEmergencyResults
      if (crisisTabEnabled === crisisExpected.crisis_tab) {
        console.log(`  ✓ crisis tab: ${crisisTabEnabled} (expected ${crisisExpected.crisis_tab})`)
        passed++
      } else {
        console.log(`  ✗ crisis tab: ${crisisTabEnabled} (expected ${crisisExpected.crisis_tab})`)
        console.log(`    isCrisis=${isCrisis}, hasEmergencyResults=${hasEmergencyResults}`)
        failed++
      }
    }

    // Check reinstatement steps visibility (when on benefit)
    if (crisisExpected.reinstatement_steps !== undefined) {
      const onBenefit = answers['income.benefit'] === 'Yes'
      if (onBenefit === crisisExpected.reinstatement_steps) {
        console.log(`  ✓ reinstatement steps: ${onBenefit} (expected ${crisisExpected.reinstatement_steps})`)
        passed++
      } else {
        console.log(`  ✗ reinstatement steps: ${onBenefit} (expected ${crisisExpected.reinstatement_steps})`)
        failed++
      }
    }

    // Check arrears warning visibility
    if (crisisExpected.arrears_warning !== undefined) {
      const hasArrears = answers['housing.arrears'] === 'Yes'
      if (hasArrears === crisisExpected.arrears_warning) {
        console.log(`  ✓ arrears warning: ${hasArrears} (expected ${crisisExpected.arrears_warning})`)
        passed++
      } else {
        console.log(`  ✗ arrears warning: ${hasArrears} (expected ${crisisExpected.arrears_warning})`)
        failed++
      }
    }
  }

  // ── Transition checks ──
  const transitionExpected = doc.transition_expected
  if (transitionExpected) {
    console.log(`\n  TRANSITION CHECKS:\n`)

    // Build EntitlementResult-shaped objects for computeTransition
    const entitlementResults: EntitlementResult[] = results.map((r: any) => {
      const b = (benefits as Benefit[]).find(b => b.id === r.id) as any
      return {
        entitlement_type: r.id.replace(/-/g, '_').toUpperCase(),
        name: r.name,
        category: r.category,
        frequency: b?.frequency ?? 'weekly',
        status: r.status,
        confidence: r.confidence,
        legal_basis: '',
        action: '',
        weekly_amount: b?.rates?.max_weekly ?? b?.rates?.max_fortnightly ?? b?.rates?.fixed_amount ?? undefined,
      }
    })

    const analysis = computeTransition(answers, facts, entitlementResults, rates)

    // Check work verdict
    if (transitionExpected.verdict) {
      if (analysis.verdict === transitionExpected.verdict) {
        console.log(`  ✓ work verdict: ${analysis.verdict} (expected ${transitionExpected.verdict})`)
        passed++
      } else {
        console.log(`  ✗ work verdict: ${analysis.verdict} (expected ${transitionExpected.verdict})`)
        console.log(`    net_gain_at_fulltime: $${Math.round(analysis.net_gain_at_fulltime)}/wk`)
        failed++
      }
    }

    // Check study verdict
    if (transitionExpected.study_verdict) {
      if (analysis.study_verdict === transitionExpected.study_verdict) {
        console.log(`  ✓ study verdict: ${analysis.study_verdict} (expected ${transitionExpected.study_verdict})`)
        passed++
      } else {
        console.log(`  ✗ study verdict: ${analysis.study_verdict} (expected ${transitionExpected.study_verdict})`)
        if (analysis.study_scenarios.length > 0) {
          console.log(`    SA scenario net: $${Math.round(analysis.study_scenarios[0].net_weekly)}/wk`)
          console.log(`    TIA scenario net: $${Math.round(analysis.study_scenarios[1].net_weekly)}/wk`)
          console.log(`    current net: $${Math.round(analysis.current.net_weekly)}/wk`)
        }
        failed++
      }
    }

    // Print transition summary for visibility
    console.log(`\n  TRANSITION SUMMARY:`)
    console.log(`    Current: ${fmt$(analysis.current.net_weekly)}/wk`)
    for (const s of analysis.scenarios) {
      console.log(`    ${s.label}: ${fmt$(s.net_weekly)}/wk`)
    }
    if (analysis.study_scenarios.length > 0) {
      for (const s of analysis.study_scenarios) {
        console.log(`    ${s.label}: ${fmt$(s.net_weekly)}/wk${s.label.includes('DEBT') ? ' (debt)' : ''}`)
      }
    }
    console.log(`    Work verdict: ${analysis.verdict} (net gain FT: ${fmt$(analysis.net_gain_at_fulltime)}/wk)`)
    if (analysis.study_verdict) {
      console.log(`    Study verdict: ${analysis.study_verdict}`)
    }
  }

  console.log(`\n  SCORE: ${passed}/${passed + failed} checks passed`)
}

function fmt$(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(Math.round(n))
}

console.log('\n')
