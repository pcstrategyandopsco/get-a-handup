import type { IntakeAnswers, EntitlementResult, RateData, IncomeScenario, TransitionAnalysis, StudyVerdict, StudyProjection, StudyROIVerdict } from '../lib/types'

export const MIN_WAGE_2026 = 23.15
const LIVING_WAGE_2026 = 27.80
const MEDIAN_WAGE_2026 = 35.00
const ABOVE_MEDIAN_2026 = 45.50

// ── Tax calculation ──

function computeAnnualTax(annualIncome: number, brackets: Array<{ threshold: number; rate: number }>): number {
  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const lower = brackets[i].threshold
    const upper = i + 1 < brackets.length ? brackets[i + 1].threshold : Infinity
    if (annualIncome <= lower) break
    const taxable = Math.min(annualIncome, upper) - lower
    tax += taxable * brackets[i].rate
  }
  return tax
}

function computeWeeklyTax(weeklyGross: number, brackets: Array<{ threshold: number; rate: number }>): number {
  return computeAnnualTax(weeklyGross * 52, brackets) / 52
}

// ── Benefit amount lookup ──

export function getBenefitBaseWeekly(
  facts: Record<string, unknown>,
  rates: RateData
): number {
  const benefitType = String(facts.benefit_type ?? '').toLowerCase()
  const hasChildren = facts.has_children === true
  const hasPartner = facts.has_partner === true
  const age = Number(facts.age ?? 25)

  if (benefitType.includes('sole parent') || benefitType.includes('sps')) {
    return rates.main_benefits?.sole_parent_support?.sole_parent ?? 434.68
  }

  if (benefitType.includes('supported living') || benefitType.includes('slp')) {
    if (hasChildren) return rates.main_benefits?.supported_living_payment?.single_with_children ?? 434.68
    if (hasPartner) return rates.main_benefits?.supported_living_payment?.couple ?? 309.60
    return rates.main_benefits?.supported_living_payment?.single_18_plus ?? 371.52
  }

  // Default: Jobseeker Support
  const js = rates.main_benefits?.jobseeker_support
  if (!js) return 337.74
  if (hasChildren && !hasPartner) return js.sole_parent ?? 434.68
  if (hasPartner) return js.couple_no_children ?? 281.28
  if (age >= 25) return js.single_25_plus ?? 337.74
  if (age >= 20) return js.single_20_24 ?? 253.81
  return js.single_18_19_away ?? 253.81
}

export function getAbatementParams(
  facts: Record<string, unknown>,
  rates: RateData
): { threshold: number; rate: number } {
  const benefitType = String(facts.benefit_type ?? '').toLowerCase()
  const abatement = rates.abatement

  if (!abatement) return { threshold: 160, rate: 0.70 }

  if (benefitType.includes('sole parent') || benefitType.includes('sps')) {
    const sps = abatement.sole_parent_support ?? { threshold_weekly: 160, rate: 0.30 }
    return { threshold: sps.threshold_weekly, rate: sps.rate }
  }
  if (benefitType.includes('supported living') || benefitType.includes('slp')) {
    const slp = abatement.supported_living_payment ?? { threshold_weekly: 160, rate: 0.30 }
    return { threshold: slp.threshold_weekly, rate: slp.rate }
  }
  const js = abatement.jobseeker_support ?? { threshold_weekly: 160, rate: 0.70 }
  return { threshold: js.threshold_weekly, rate: js.rate }
}

function computeAbatement(weeklyEarnings: number, params: { threshold: number; rate: number }): number {
  if (weeklyEarnings <= params.threshold) return 0
  return (weeklyEarnings - params.threshold) * params.rate
}

// ── Supplement estimation ──

export function getASWeekly(facts: Record<string, unknown>, rates: RateData): number {
  const zone = `area_${facts.accom_zone ?? 3}`
  const as = rates.accommodation_supplement?.[zone]
  if (!as) return 0

  const hasChildren = facts.has_children === true
  const hasPartner = facts.has_partner === true
  const childCount = Number(facts.child_count ?? 0)

  if (!hasPartner && hasChildren && childCount >= 2) return as.sole_parent_2_plus ?? 0
  if (!hasPartner && hasChildren) return as.sole_parent_1_child ?? 0
  if (hasPartner && hasChildren) return as.couple_with_children ?? 0
  if (hasPartner) return as.couple_no_children ?? 0
  return as.single_no_children ?? 0
}

export function getSupplementsWeekly(
  results: EntitlementResult[],
  facts: Record<string, unknown>,
  rates: RateData,
  excludeAS: boolean
): number {
  let total = 0
  // Only count actual supplements — not employment programmes, family tax credits,
  // housing grants, or other categories that aren't regular weekly supplement payments
  for (const r of results) {
    if (r.category !== 'supplement') continue
    if (['one-off', 'as-needed'].includes(r.frequency)) continue
    if (excludeAS && r.entitlement_type === 'ACCOMMODATION_SUPPLEMENT') continue
    // AS: use computed zone/household rate, not the max from benefit definition
    if (r.entitlement_type === 'ACCOMMODATION_SUPPLEMENT') {
      total += getASWeekly(facts, rates)
      continue
    }

    const amt = parseAmount(r.weekly_amount)
    if (amt > 0) total += amt
  }

  // If AS wasn't in results but facts show housing, estimate it
  if (!excludeAS && !results.some(r => r.entitlement_type === 'ACCOMMODATION_SUPPLEMENT')) {
    total += getASWeekly(facts, rates)
  }

  return total
}

function parseAmount(str?: string): number {
  if (!str) return 0
  const m = str.match(/\$(\d[\d,]*\.?\d*)/)
  return m ? parseFloat(m[1].replace(/,/g, '')) : 0
}

// ── Work incentives ──

export function computeWorkIncentives(
  weeklyGross: number,
  weeklyHours: number,
  onBenefit: boolean,
  facts: Record<string, unknown>,
  rates: RateData
): { total: number; items: string[] } {
  let total = 0
  const items: string[] = []
  const wi = rates.work_incentives
  if (!wi) return { total, items }

  const hasChildren = facts.has_children === true
  const hasPartner = facts.has_partner === true

  // IWTC: off-benefit, has children, enough hours
  if (!onBenefit && hasChildren) {
    const minHours = hasPartner ? wi.in_work_tax_credit.min_hours_couple : wi.in_work_tax_credit.min_hours_single
    if (weeklyHours >= minHours) {
      total += wi.in_work_tax_credit.weekly
      items.push(`In Work Tax Credit +$${wi.in_work_tax_credit.weekly}/wk`)
    }
  }

  // IETC: off-benefit, income in $24k-$48k band, no children (WFF excludes)
  if (!onBenefit && !hasChildren) {
    const annual = weeklyGross * 52
    if (annual >= wi.independent_earner_tax_credit.income_min && annual <= wi.independent_earner_tax_credit.income_max) {
      const weekly = wi.independent_earner_tax_credit.annual / 52
      total += weekly
      items.push(`Independent Earner Tax Credit +$${weekly.toFixed(0)}/wk`)
    }
  }

  // MFTC: off-benefit, has children, enough hours, below floor
  if (!onBenefit && hasChildren) {
    const minHours = hasPartner ? wi.minimum_family_tax_credit.min_hours_couple : wi.minimum_family_tax_credit.min_hours_single
    if (weeklyHours >= minHours) {
      const weeklyFloor = wi.minimum_family_tax_credit.annual_floor / 52
      const netAfterTax = weeklyGross - computeWeeklyTax(weeklyGross, rates.tax_brackets) - weeklyGross * rates.acc_levy
      if (netAfterTax < weeklyFloor) {
        const topup = weeklyFloor - netAfterTax
        total += topup
        items.push(`Minimum Family Tax Credit +$${topup.toFixed(0)}/wk`)
      }
    }
  }

  return { total, items }
}

// ── Childcare cost estimation ──

export function estimateChildcareCost(facts: Record<string, unknown>, rates: RateData): number {
  if (facts.has_children !== true) return 0
  const childcare = rates.childcare
  if (!childcare) return 0

  const ages = facts.child_ages as string[] | undefined
  if (!ages || ages.length === 0) return 0

  let cost = 0
  for (const age of ages) {
    if (age === 'Under 1 year' || age === '1 – 2 years') {
      cost += childcare.under_3_weekly
    } else if (age === '3 – 4 years') {
      cost += childcare.age_3_to_5_weekly
    }
    // 5+ are in school, no childcare cost
  }
  return cost
}

// ── Scenario builder ──

export function buildScenario(
  label: string,
  weeklyHours: number,
  hourlyRate: number,
  onBenefit: boolean,
  facts: Record<string, unknown>,
  results: EntitlementResult[],
  rates: RateData,
  benefitBase: number,
  abatementParams: { threshold: number; rate: number }
): IncomeScenario {
  const gross = weeklyHours * hourlyRate
  const tax = computeWeeklyTax(gross, rates.tax_brackets)
  const acc = gross * rates.acc_levy

  let benefit = 0
  let abatement = 0
  let supplements = 0

  if (onBenefit) {
    // For couples, partner income is included in abatement calculation
    const partnerIncome = Number(facts.partner_income ?? 0)
    const hasPartner = facts.has_partner === true
    const abatementInput = hasPartner ? gross + partnerIncome : gross
    abatement = computeAbatement(abatementInput, abatementParams)
    benefit = Math.max(0, benefitBase - abatement)
    // On benefit: keep supplements (DA stays, AS partially, TAS may be lost)
    supplements = getSupplementsWeekly(results, facts, rates, false)
    // Rough approximation: if abatement eats most of benefit, TAS is gone
    if (benefit < 20) {
      supplements *= 0.5 // rough — heavy abatement erodes supplements
    }
  }

  const incentives = computeWorkIncentives(gross, weeklyHours, onBenefit, facts, rates)

  // Off-benefit housing: Accommodation Benefit (much lower than AS)
  let offBenefitHousing = 0
  if (!onBenefit && facts.has_housing === true) {
    offBenefitHousing = rates.work_incentives?.accommodation_benefit?.max_weekly ?? 0
  }

  // Childcare costs: deduct when working and has young children
  const childcareCost = weeklyHours > 0 ? estimateChildcareCost(facts, rates) : 0

  const net = gross - tax - acc - abatement - childcareCost + benefit + supplements + incentives.total + offBenefitHousing
  const effectiveTaxRate = gross > 0 ? 1 - (net / gross) : 0

  return {
    label,
    gross_weekly: gross,
    tax_weekly: tax,
    acc_weekly: acc,
    benefit_weekly: benefit,
    abatement_weekly: abatement,
    supplements_weekly: supplements + offBenefitHousing,
    work_incentives_weekly: incentives.total,
    childcare_cost_weekly: childcareCost,
    net_weekly: net,
    net_annual: net * 52,
    effective_tax_rate: Math.max(0, effectiveTaxRate),
  }
}

// ── Study scenario builder ──

function lookupSARate(facts: Record<string, unknown>, rates: RateData): number {
  const sl = rates.studylink
  if (!sl) return 368.96
  const sa = sl.student_allowance
  const age = Number(facts.age ?? 25)
  const hasPartner = facts.has_partner === true
  const hasChildren = facts.has_children === true
  const atHome = facts.housing_type === 'with_parents'

  if (hasPartner) return sa.couple_each ?? sa.couple ?? 323.33
  if (hasChildren) return sa.single_with_children ?? 519.81
  if (age >= 24) return atHome ? (sa.single_24_plus_at_home ?? 314.21) : (sa.single_24_plus_away ?? 368.96)
  return atHome ? (sa.single_under_24_at_home ?? 277.72) : (sa.single_under_24_away ?? 323.33)
}

function buildStudyScenarios(
  facts: Record<string, unknown>,
  results: EntitlementResult[],
  rates: RateData,
  currentNet: number,
  benefitBase: number,
  currentSupplements: number,
): {
  scenarios: IncomeScenario[]
  gains: string[]
  losses: string[]
  verdict: StudyVerdict
} {
  const sl = rates.studylink
  const age = Number(facts.age ?? 25)

  // Gate: only show study scenarios for ages 18-65 on a main benefit
  if (age < 18 || age > 65 || !results.some(r => r.category === 'main')) {
    return { scenarios: [], gains: [], losses: [], verdict: null }
  }

  const brackets = rates.tax_brackets
  const accLevy = rates.acc_levy

  // Childcare costs: studying full-time requires childcare for young children
  const childcareCost = estimateChildcareCost(facts, rates)

  // ── Scenario 1: Student Allowance + Accommodation Benefit ──
  const saRate = lookupSARate(facts, rates)
  const saTax = computeWeeklyTax(saRate, brackets)
  const saAcc = saRate * accLevy
  const abMax = sl?.accommodation_benefit?.max_weekly ?? 60
  const saNet = saRate - saTax - saAcc + abMax - childcareCost

  const saScenario: IncomeScenario = {
    label: 'Student Allowance + AB',
    gross_weekly: saRate,
    tax_weekly: saTax,
    acc_weekly: saAcc,
    benefit_weekly: 0,
    abatement_weekly: 0,
    supplements_weekly: abMax,
    work_incentives_weekly: 0,
    childcare_cost_weekly: childcareCost,
    net_weekly: saNet,
    net_annual: saNet * 52,
    effective_tax_rate: saRate > 0 ? 1 - (saNet / saRate) : 0,
  }

  // ── Scenario 2: Stay on benefit + TIA ──
  const tiaWeekly = sl?.training_incentive_allowance?.weekly_equivalent ?? 106.75
  const tiaBenefitNet = currentNet + tiaWeekly - childcareCost

  const tiaScenario: IncomeScenario = {
    label: 'Stay on benefit + TIA',
    gross_weekly: 0,
    tax_weekly: 0,
    acc_weekly: 0,
    benefit_weekly: benefitBase,
    abatement_weekly: 0,
    supplements_weekly: currentSupplements,
    work_incentives_weekly: tiaWeekly,
    childcare_cost_weekly: childcareCost,
    net_weekly: tiaBenefitNet,
    net_annual: tiaBenefitNet * 52,
    effective_tax_rate: 0,
  }

  // ── Scenario 3: Student Loan living costs (DEBT) ──
  const slLiving = sl?.student_loan_living_costs?.weekly ?? 323.43
  // Student loan is not taxable but it's debt — no supplements, no AB without SA
  const slNet = slLiving - childcareCost
  const slScenario: IncomeScenario = {
    label: 'Student Loan only (DEBT)',
    gross_weekly: slLiving,
    tax_weekly: 0,
    acc_weekly: 0,
    benefit_weekly: 0,
    abatement_weekly: 0,
    supplements_weekly: 0,
    work_incentives_weekly: 0,
    childcare_cost_weekly: childcareCost,
    net_weekly: slNet,
    net_annual: slNet * 52,
    effective_tax_rate: 0,
    is_debt: true,
  }

  // ── Gains / losses ──
  const gains: string[] = [
    'No work obligations while studying',
    'Student Loan interest-free while in NZ',
  ]

  const losses: string[] = [
    'Fees-free covers final year only — earlier years must be Student Loan (repayable debt)',
    'Gap period: benefit stops before SA starts (may be weeks with no income)',
  ]
  if (age < 24) {
    losses.push('SA means-tested against parental income (zero above $137k/yr)')
  }
  const asWeekly = getASWeekly(facts, rates)
  if (asWeekly > abMax) {
    losses.push(`Housing support drops AS→AB (-$${Math.round(asWeekly - abMax)}/wk)`)
  }
  if (results.some(r => r.entitlement_type === 'WINTER_ENERGY_PAYMENT')) {
    losses.push('Winter Energy Payment ($20.46/wk)')
  }
  if (results.some(r => r.entitlement_type === 'TEMPORARY_ADDITIONAL_SUPPORT')) {
    losses.push('Temporary Additional Support')
  }
  if (results.some(r => r.entitlement_type === 'DISABILITY_ALLOWANCE')) {
    losses.push('Disability Allowance')
  }
  if (results.some(r => r.entitlement_type === 'COMMUNITY_SERVICES_CARD')) {
    losses.push('Community Services Card')
  }
  if (childcareCost > 0) {
    const ages = facts.child_ages as string[] | undefined
    const youngChildren = (ages ?? []).filter(a => a === 'Under 1 year' || a === '1 – 2 years' || a === '3 – 4 years').length
    losses.push(`Estimated childcare ($${childcareCost}/wk for ${youngChildren} child${youngChildren !== 1 ? 'ren' : ''} under 5)`)
  }

  // Verdict: compare SA scenario vs current
  const saNetGain = saNet - currentNet
  let verdict: StudyVerdict
  if (saNetGain > 20) verdict = 'better_studying'
  else if (saNetGain >= -20) verdict = 'marginal'
  else verdict = 'trap'

  return {
    scenarios: [saScenario, tiaScenario, slScenario],
    gains,
    losses,
    verdict,
  }
}

// ── Study projection ──

export function computeStudyProjection(
  targetHourly: number,
  trainingWeeks: number,
  jobSearchWeeks: number,
  currentNet: number,
  bestStudyNet: number,
  facts: Record<string, unknown>,
  rates: RateData,
): StudyProjection {
  const HORIZON_WEEKS = 260 // 5 years

  // Build post-study working scenario: full-time at target rate, off-benefit
  const gross = 40 * targetHourly
  const tax = computeWeeklyTax(gross, rates.tax_brackets)
  const acc = gross * rates.acc_levy
  const incentives = computeWorkIncentives(gross, 40, false, facts, rates)

  // Off-benefit housing: Accommodation Benefit
  let offBenefitHousing = 0
  if (facts.has_housing === true) {
    offBenefitHousing = rates.work_incentives?.accommodation_benefit?.max_weekly ?? 0
  }

  // Childcare costs: working full-time post-study requires childcare for young children
  const childcareCost = estimateChildcareCost(facts, rates)

  const postStudyNet = gross - tax - acc - childcareCost + incentives.total + offBenefitHousing

  const postStudyScenario: IncomeScenario = {
    label: `Working at $${targetHourly.toFixed(2)}/hr`,
    gross_weekly: gross,
    tax_weekly: tax,
    acc_weekly: acc,
    benefit_weekly: 0,
    abatement_weekly: 0,
    supplements_weekly: offBenefitHousing,
    work_incentives_weekly: incentives.total,
    childcare_cost_weekly: childcareCost,
    net_weekly: postStudyNet,
    net_annual: postStudyNet * 52,
    effective_tax_rate: gross > 0 ? Math.max(0, 1 - (postStudyNet / gross)) : 0,
  }

  // Cumulative comparison over 5-year horizon
  // Path A: stay on benefit — currentNet every week
  // Path B: study (bestStudyNet) → job search (currentNet) → work (postStudyNet)
  const workingWeeks = HORIZON_WEEKS - trainingWeeks - jobSearchWeeks

  let cumulativeA = 0
  let cumulativeB = 0
  let breakevenWeek: number | null = null

  for (let w = 1; w <= HORIZON_WEEKS; w++) {
    cumulativeA += currentNet

    if (w <= trainingWeeks) {
      cumulativeB += bestStudyNet
    } else if (w <= trainingWeeks + jobSearchWeeks) {
      cumulativeB += currentNet
    } else {
      cumulativeB += postStudyNet
    }

    if (breakevenWeek === null && cumulativeB > cumulativeA) {
      breakevenWeek = w
    }
  }

  const fiveYearGain = cumulativeB - cumulativeA

  let roiVerdict: StudyROIVerdict
  if (breakevenWeek === null) {
    roiVerdict = 'net_loss'
  } else if (breakevenWeek < 104) {
    roiVerdict = 'strong_return'
  } else if (breakevenWeek < 208) {
    roiVerdict = 'moderate_return'
  } else {
    roiVerdict = 'long_payback'
  }

  return {
    target_hourly: targetHourly,
    training_weeks: trainingWeeks,
    job_search_weeks: jobSearchWeeks,
    post_study_scenario: postStudyScenario,
    study_phase_net: bestStudyNet,
    breakeven_weeks: breakevenWeek,
    five_year_gain: fiveYearGain,
    roi_verdict: roiVerdict,
  }
}

// ── Main entry point ──

export function computeTransition(
  answers: IntakeAnswers,
  facts: Record<string, unknown>,
  results: EntitlementResult[],
  rates: RateData
): TransitionAnalysis {
  const benefitBase = getBenefitBaseWeekly(facts, rates)
  const abatementParams = getAbatementParams(facts, rates)
  const currentEarnings = Number(facts.weekly_income ?? 0)
  const currentHours = Number(facts.hours_worked ?? 0)
  const asWeekly = getASWeekly(facts, rates)

  // Current scenario: on benefit with declared earnings
  // For couples, partner income counts towards abatement (SSA 2018 Schedule 4)
  const partnerIncome = Number(facts.partner_income ?? 0)
  const hasPartner = facts.has_partner === true
  const currentAbatementInput = hasPartner ? currentEarnings + partnerIncome : currentEarnings
  const currentAbatement = computeAbatement(currentAbatementInput, abatementParams)
  const currentBenefit = Math.max(0, benefitBase - currentAbatement)
  const currentSupplements = getSupplementsWeekly(results, facts, rates, false)
  const currentTax = computeWeeklyTax(currentEarnings, rates.tax_brackets)
  const currentAcc = currentEarnings * rates.acc_levy
  const currentNet = currentEarnings - currentTax - currentAcc + currentBenefit + currentSupplements

  const current: IncomeScenario = {
    label: 'Current (on benefit)',
    gross_weekly: currentEarnings,
    tax_weekly: currentTax,
    acc_weekly: currentAcc,
    benefit_weekly: currentBenefit,
    abatement_weekly: currentAbatement,
    supplements_weekly: currentSupplements,
    work_incentives_weekly: 0,
    net_weekly: currentNet,
    net_annual: currentNet * 52,
    effective_tax_rate: currentEarnings > 0 ? Math.max(0, 1 - (currentNet / (currentEarnings + benefitBase))) : 0,
  }

  // Work scenarios
  const scenarios: IncomeScenario[] = [
    buildScenario('Part-time min wage (20hrs)', 20, MIN_WAGE_2026, true, facts, results, rates, benefitBase, abatementParams),
    buildScenario('Full-time min wage (40hrs)', 40, MIN_WAGE_2026, false, facts, results, rates, benefitBase, abatementParams),
    buildScenario('Full-time living wage (40hrs)', 40, LIVING_WAGE_2026, false, facts, results, rates, benefitBase, abatementParams),
  ]

  // Crossover: binary search for hourly rate at 40hrs where working > current
  let crossoverRate: number | null = null
  let lo = 10
  let hi = 50
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const scenario = buildScenario('test', 40, mid, false, facts, results, rates, benefitBase, abatementParams)
    if (scenario.net_weekly > currentNet) {
      hi = mid
    } else {
      lo = mid
    }
  }
  const testScenario = buildScenario('test', 40, lo, false, facts, results, rates, benefitBase, abatementParams)
  if (testScenario.net_weekly > currentNet - 5) {
    crossoverRate = Math.round(lo * 100) / 100
  }

  // Housing cliff: AS vs Accommodation Benefit
  const abMax = rates.work_incentives?.accommodation_benefit?.max_weekly ?? 60
  const housingCliff = Math.max(0, asWeekly - abMax)

  // Gains / losses
  const gains: string[] = []
  const losses: string[] = []

  const ftScenario = scenarios[1] // full-time min wage
  if (ftScenario.work_incentives_weekly > 0) gains.push('Work incentive tax credits')
  if (facts.has_children) gains.push('In Work Tax Credit eligibility')
  if (!facts.has_children) gains.push('Independent Earner Tax Credit potential')
  gains.push('No abatement on earnings')
  gains.push('No benefit obligations or appointments')

  if (asWeekly > 0) losses.push(`Accommodation Supplement (up to $${asWeekly}/wk)`)
  if (results.some(r => r.entitlement_type === 'DISABILITY_ALLOWANCE')) losses.push('Disability Allowance')
  if (results.some(r => r.entitlement_type === 'TEMPORARY_ADDITIONAL_SUPPORT')) losses.push('Temporary Additional Support')
  if (results.some(r => r.entitlement_type === 'WINTER_ENERGY_PAYMENT')) losses.push('Winter Energy Payment')
  if (results.some(r => r.entitlement_type === 'COMMUNITY_SERVICES_CARD')) losses.push('Community Services Card')

  const childcareCost = estimateChildcareCost(facts, rates)
  if (childcareCost > 0) {
    const ages = facts.child_ages as string[] | undefined
    const youngChildren = (ages ?? []).filter(a => a === 'Under 1 year' || a === '1 – 2 years' || a === '3 – 4 years').length
    losses.push(`Estimated childcare ($${childcareCost}/wk for ${youngChildren} child${youngChildren !== 1 ? 'ren' : ''} under 5)`)
  }

  const netGainAtFulltime = ftScenario.net_weekly - currentNet
  let verdict: 'better_working' | 'marginal' | 'trap'
  if (netGainAtFulltime > 20) verdict = 'better_working'
  else if (netGainAtFulltime >= -20) verdict = 'marginal'
  else verdict = 'trap'

  // Study scenarios
  const study = buildStudyScenarios(facts, results, rates, currentNet, benefitBase, currentSupplements)

  // Default study projection: median wage, 1 year training, 3 months job search
  // Use SA+AB scenario (index 0) — represents actually switching to StudyLink.
  // TIA scenario stays on benefit so has no investment cost and no meaningful breakeven.
  let studyProjection: StudyProjection | null = null
  if (study.scenarios.length > 0) {
    const saScenarioNet = study.scenarios[0].net_weekly
    studyProjection = computeStudyProjection(
      MEDIAN_WAGE_2026, 52, 13, currentNet, saScenarioNet, facts, rates
    )
  }

  return {
    current,
    scenarios,
    crossover_hourly_rate: crossoverRate,
    crossover_weekly_hours: crossoverRate ? 40 : null,
    housing_cliff: housingCliff,
    gains,
    losses,
    net_gain_at_fulltime: netGainAtFulltime,
    verdict,
    study_scenarios: study.scenarios,
    study_gains: study.gains,
    study_losses: study.losses,
    study_verdict: study.verdict,
    study_projection: studyProjection,
  }
}
