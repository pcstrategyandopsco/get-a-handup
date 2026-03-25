// All intake questions with branching logic
// Each question's next() function returns the next question ID or null (complete)
// 10 sections, ~54 questions covering the full NZ benefit landscape
// Triage gate routes users into crisis/sanctions/appeal/full paths

import type { IntakeAnswers } from '../lib/types'

export type QuestionType = 'choice' | 'multi-choice' | 'number' | 'boolean' | 'text' | 'upload'

export type Question = {
  id: string
  section: string
  sectionIndex: number
  number: string
  text: string
  hint?: string               // One-line context: why this question matters
  type: QuestionType
  options?: string[]
  unit?: string
  placeholder?: string
  next: (answer: unknown, answers: IntakeAnswers) => string | null
}

export type TriageMode = 'full' | 'crisis' | 'sanctions' | 'appeal' | null

export function getTriageMode(answers: IntakeAnswers): TriageMode {
  const reason = answers['triage.reason']
  if (reason === 'I need help right now (food, rent, power, medical)') return 'crisis'
  if (reason === 'My benefit was reduced or stopped') return 'sanctions'
  if (reason === 'I was declined a benefit and want to challenge it') return 'appeal'
  if (reason === 'Full assessment of everything I might be entitled to') return 'full'
  return null
}

export const SECTIONS = [
  'TRIAGE',
  'PERSONAL',
  'HOUSING',
  'INCOME',
  'HEALTH',
  'CHILDREN',
  'EDUCATION',
  'EMPLOYMENT',
  'HISTORY',
  'SITUATION'
]

export const questions: Question[] = [
  // ── TRIAGE ──
  {
    id: 'triage.reason',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.1',
    text: 'What brings you here today?',
    hint: 'This determines which questions we ask and what results we prioritise.',
    type: 'choice',
    options: [
      'Full assessment of everything I might be entitled to',
      'I need help right now (food, rent, power, medical)',
      'My benefit was reduced or stopped',
      'I was declined a benefit and want to challenge it'
    ],
    next: (a) => {
      if (a === 'I need help right now (food, rent, power, medical)') return 'triage.crisis_needs'
      if (a === 'My benefit was reduced or stopped') return 'triage.sanction_type'
      if (a === 'I was declined a benefit and want to challenge it') return 'triage.appeal_benefit'
      return 'personal.age'
    }
  },
  {
    id: 'triage.crisis_needs',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.2',
    text: 'What do you need help with?',
    hint: 'Select all that apply. This determines which emergency grants we surface.',
    type: 'multi-choice',
    options: ['Food', 'Rent or housing costs', 'Power or heating', 'Medical costs', 'Other urgent need'],
    next: () => 'personal.age'
  },
  {
    id: 'triage.sanction_type',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.2',
    text: 'What happened to your benefit?',
    type: 'choice',
    options: ['Reduced', 'Stopped completely', 'Unsure'],
    next: () => 'triage.sanction_notified'
  },
  {
    id: 'triage.sanction_notified',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.3',
    text: 'Were you notified about the reason?',
    type: 'choice',
    options: ['Yes', 'No', 'Unsure'],
    next: () => 'triage.sanction_written'
  },
  {
    id: 'triage.sanction_written',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.4',
    text: 'Were you given a written reason for the decision?',
    hint: 'MSD must provide written decisions under s12 Social Security Act 2018.',
    type: 'choice',
    options: ['Yes', 'No', 'No reason given'],
    next: () => 'personal.age'
  },
  {
    id: 'triage.appeal_benefit',
    section: 'TRIAGE',
    sectionIndex: 0,
    number: '0.2',
    text: 'Which benefit were you declined?',
    type: 'choice',
    options: [
      'Jobseeker Support',
      'Sole Parent Support',
      'Supported Living Payment',
      'Accommodation Supplement',
      'Disability Allowance',
      'Temporary Additional Support',
      'Special Needs Grant',
      'Other'
    ],
    next: () => 'personal.age'
  },

  // ── PERSONAL ──
  {
    id: 'personal.age',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.1',
    text: 'How old are you?',
    hint: 'Age thresholds determine which benefits you can access.',
    type: 'number',
    placeholder: '0',
    next: () => 'personal.residency'
  },
  {
    id: 'personal.residency',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.2',
    text: 'What is your residency status?',
    hint: 'Most benefits require NZ citizenship or permanent residency.',
    type: 'choice',
    options: ['NZ Citizen', 'Permanent Resident', 'Resident Visa', 'Refugee / Protected Person', 'Other visa'],
    next: (a, answers) => {
      const mode = getTriageMode(answers)
      if (a === 'Other visa') return 'housing.type'
      // Crisis/sanctions/appeal: skip years_in_nz, relationship, partner questions
      if (mode === 'crisis' || mode === 'sanctions' || mode === 'appeal') return 'housing.type'
      return 'personal.years_in_nz'
    }
  },
  {
    id: 'personal.years_in_nz',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.3',
    text: 'How many years have you lived in New Zealand?',
    type: 'number',
    placeholder: '0',
    next: () => 'personal.relationship'
  },
  {
    id: 'personal.relationship',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.4',
    text: 'What is your relationship status?',
    hint: 'Affects benefit rates. Partner income is tested against your entitlements.',
    type: 'choice',
    options: ['Single', 'In a relationship / de facto', 'Married / civil union', 'Separated', 'Widowed'],
    next: (a) => {
      if (a === 'Single' || a === 'Separated' || a === 'Widowed') return 'housing.type'
      return 'personal.partner_employed'
    }
  },
  {
    id: 'personal.partner_employed',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.5',
    text: 'Is your partner currently employed?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'personal.partner_income' : 'housing.type'
  },
  {
    id: 'personal.partner_income',
    section: 'PERSONAL',
    sectionIndex: 1,
    number: '1.6',
    text: "What is your partner's weekly income before tax?",
    type: 'number',
    unit: '$/wk',
    placeholder: '0',
    next: () => 'housing.type'
  },

  // ── HOUSING ──
  {
    id: 'housing.type',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.1',
    text: 'Are you currently renting, boarding, or paying a mortgage?',
    hint: 'Determines eligibility for Accommodation Supplement and housing grants.',
    type: 'choice',
    options: ['Renting', 'Boarding', 'Mortgage', 'None of these'],
    next: (a, answers) => {
      const mode = getTriageMode(answers)
      if (a === 'None of these') {
        // Crisis/sanctions: skip to income.benefit
        if (mode === 'crisis' || mode === 'sanctions') return 'income.benefit'
        return 'income.employed'
      }
      // Crisis/sanctions: skip cost, region, social_housing — go straight to arrears
      if (mode === 'crisis' || mode === 'sanctions') return 'housing.arrears'
      return 'housing.cost'
    }
  },
  {
    id: 'housing.cost',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.2',
    text: 'How much do you pay per week?',
    hint: 'Used to calculate Accommodation Supplement amount by region.',
    type: 'number',
    unit: '$/wk',
    placeholder: '0',
    next: () => 'housing.region'
  },
  {
    id: 'housing.region',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.3',
    text: 'Which region do you live in?',
    type: 'choice',
    options: ['Auckland', 'Wellington', 'Canterbury / Christchurch', 'Other'],
    next: () => 'housing.social_housing'
  },
  {
    id: 'housing.social_housing',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.4',
    text: 'Are you in Kainga Ora (Housing NZ) or community housing?',
    hint: 'Social housing tenants cannot receive Accommodation Supplement.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'housing.arrears'
  },
  {
    id: 'housing.arrears',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.5',
    text: 'Do you have any rent or mortgage arrears, or are you at risk of losing your housing?',
    hint: 'Unlocks emergency housing grants and rent arrears assistance.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (_a, answers) => {
      const mode = getTriageMode(answers)
      // Crisis/sanctions: skip need_to_move, go to income.benefit
      if (mode === 'crisis' || mode === 'sanctions') return 'income.benefit'
      return 'housing.need_to_move'
    }
  },
  {
    id: 'housing.need_to_move',
    section: 'HOUSING',
    sectionIndex: 2,
    number: '2.6',
    text: 'Do you need to move or find new accommodation?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'income.employed'
  },

  // ── INCOME ──
  {
    id: 'income.employed',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.1',
    text: 'Are you currently employed?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'income.hours' : 'income.benefit'
  },
  {
    id: 'income.hours',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.2',
    text: 'How many hours per week do you work?',
    type: 'number',
    unit: 'hrs/wk',
    placeholder: '0',
    next: () => 'income.amount'
  },
  {
    id: 'income.amount',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.3',
    text: 'What is your weekly income before tax?',
    type: 'number',
    unit: '$/wk',
    placeholder: '0',
    next: () => 'income.benefit'
  },
  {
    id: 'income.benefit',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.4',
    text: 'Are you currently receiving any main benefit?',
    hint: 'Many supplements require you to be on a main benefit first.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a, answers) => {
      const mode = getTriageMode(answers)
      if (a === 'Yes') return 'income.benefit_type'
      // Crisis/sanctions: end here if not on benefit
      if (mode === 'crisis' || mode === 'sanctions') return null
      return 'income.assets'
    }
  },
  {
    id: 'income.benefit_type',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.5',
    text: 'Which benefit are you receiving?',
    type: 'choice',
    options: [
      'Jobseeker Support',
      'Sole Parent Support',
      'Supported Living Payment',
      'Youth Payment / Young Parent Payment',
      'Emergency Benefit',
      'Other'
    ],
    next: (_a, answers) => {
      const mode = getTriageMode(answers)
      // Crisis/sanctions: end after benefit type
      if (mode === 'crisis' || mode === 'sanctions') return null
      return 'income.current_supplements'
    }
  },
  {
    id: 'income.current_supplements',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.6',
    text: 'Which of these payments are you already receiving? Select all that apply, or None.',
    hint: 'So we can identify what you are missing rather than what you already have.',
    type: 'multi-choice',
    options: [
      'Accommodation Supplement',
      'Disability Allowance',
      'Temporary Additional Support',
      'Childcare Assistance',
      'Child Disability Allowance',
      'Winter Energy Payment',
      'Working for Families',
      'None of these'
    ],
    next: () => 'income.assets'
  },
  {
    id: 'income.assets',
    section: 'INCOME',
    sectionIndex: 3,
    number: '3.7',
    text: 'What is the approximate total value of your cash, savings, and investments?',
    hint: 'Some benefits have asset limits — $8,100 single, $16,200 couple.',
    type: 'choice',
    options: ['Under $8,100', '$8,100 – $16,200', 'Over $16,200', 'Unsure'],
    next: () => 'health.condition'
  },

  // ── HEALTH ──
  {
    id: 'health.condition',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.1',
    text: 'Do you have a health condition or disability that affects your daily life?',
    hint: 'Unlocks Disability Allowance, Supported Living Payment, and health cost payments.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'health.duration' : 'children.dependent'
  },
  {
    id: 'health.duration',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.2',
    text: 'How long has this condition affected you?',
    type: 'choice',
    options: ['Less than 2 weeks', '2 weeks – 6 months', '6 months – 2 years', 'More than 2 years', 'Permanent / lifelong'],
    next: () => 'health.costs'
  },
  {
    id: 'health.costs',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.3',
    text: 'Does this result in regular ongoing costs — medical, transport, equipment?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'health.cost_types'
  },
  {
    id: 'health.cost_types',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.4',
    text: 'Which types of costs do you have? Select all that apply.',
    type: 'multi-choice',
    options: [
      'GP / specialist visits',
      'Prescriptions / medication',
      'Transport to appointments',
      'Equipment or aids',
      'Extra power / heating',
      'Home modifications needed',
      'None of these'
    ],
    next: () => 'health.hours_able'
  },
  {
    id: 'health.hours_able',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.5',
    text: 'How many hours per week are you able to work regularly?',
    hint: 'Under 15 hrs qualifies for Supported Living Payment — higher rate, lower abatement.',
    type: 'choice',
    options: ['Unable to work', 'Less than 15 hrs', '15 – 30 hrs', 'More than 30 hrs'],
    next: () => 'health.residential_care'
  },
  {
    id: 'health.residential_care',
    section: 'HEALTH',
    sectionIndex: 4,
    number: '4.6',
    text: 'Are you currently in, or about to enter, residential care (rest home, hospital-level care)?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'children.dependent'
  },

  // ── CHILDREN ──
  {
    id: 'children.dependent',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.1',
    text: 'Do you have dependent children living with you?',
    hint: 'Opens Sole Parent Support, Working for Families, and childcare pathways.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'children.count' : 'children.caring_for_other'
  },
  {
    id: 'children.count',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.2',
    text: 'How many dependent children?',
    type: 'number',
    placeholder: '0',
    next: () => 'children.ages'
  },
  {
    id: 'children.ages',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.3',
    text: 'What are the age ranges of your children? Select all that apply.',
    type: 'multi-choice',
    options: ['Under 1 year', '1 – 2 years', '3 – 4 years', '5 – 13 years', '14 – 17 years'],
    next: () => 'children.childcare'
  },
  {
    id: 'children.childcare',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.4',
    text: 'Are any children under 5 attending early childhood education?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'children.disability'
  },
  {
    id: 'children.disability',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.5',
    text: 'Does any child have a serious disability requiring extra care?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'children.caring_for_other'
  },
  {
    id: 'children.caring_for_other',
    section: 'CHILDREN',
    sectionIndex: 5,
    number: '5.6',
    text: 'Are you caring for a child who is not your own (e.g. grandchild, whangai, foster)?',
    hint: 'May qualify for Orphan\'s Benefit or Unsupported Child Benefit.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'education.studying'
  },

  // ── EDUCATION ──
  {
    id: 'education.studying',
    section: 'EDUCATION',
    sectionIndex: 6,
    number: '6.1',
    text: 'Are you currently studying, or planning to start studying?',
    hint: 'StudyLink pathways — Student Allowance, living costs, accommodation.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'education.level' : 'employment.seeking_work'
  },
  {
    id: 'education.level',
    section: 'EDUCATION',
    sectionIndex: 6,
    number: '6.2',
    text: 'What level of study?',
    type: 'choice',
    options: ['Certificate / Diploma', "Bachelor's degree", 'Postgraduate (Honours)', 'Masters', 'PhD / Doctorate'],
    next: () => 'education.load'
  },
  {
    id: 'education.load',
    section: 'EDUCATION',
    sectionIndex: 6,
    number: '6.3',
    text: 'Are you studying full-time or part-time?',
    type: 'choice',
    options: ['Full-time', 'Part-time'],
    next: () => 'education.papers'
  },
  {
    id: 'education.papers',
    section: 'EDUCATION',
    sectionIndex: 6,
    number: '6.4',
    text: 'How many papers or courses per semester?',
    type: 'number',
    placeholder: '0',
    next: () => 'employment.seeking_work'
  },

  // ── EMPLOYMENT ──
  {
    id: 'employment.seeking_work',
    section: 'EMPLOYMENT',
    sectionIndex: 7,
    number: '7.1',
    text: 'Are you currently looking for work or wanting to change jobs?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'employment.unemployment_duration' : 'employment.training_interest'
  },
  {
    id: 'employment.unemployment_duration',
    section: 'EMPLOYMENT',
    sectionIndex: 7,
    number: '7.2',
    text: 'How long have you been looking for work?',
    type: 'choice',
    options: ['Less than 4 weeks', '1 – 3 months', '3 – 12 months', 'More than 12 months'],
    next: () => 'employment.training_interest'
  },
  {
    id: 'employment.training_interest',
    section: 'EMPLOYMENT',
    sectionIndex: 7,
    number: '7.3',
    text: 'Are you interested in training, courses, or an apprenticeship?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'employment.seasonal'
  },
  {
    id: 'employment.seasonal',
    section: 'EMPLOYMENT',
    sectionIndex: 7,
    number: '7.4',
    text: 'Do you do seasonal work (e.g. horticulture, tourism)?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'employment.self_employed'
  },
  {
    id: 'employment.self_employed',
    section: 'EMPLOYMENT',
    sectionIndex: 7,
    number: '7.5',
    text: 'Are you self-employed or considering starting a business?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'history.past_denied'
  },

  // ── HISTORY ──
  {
    id: 'history.past_denied',
    section: 'HISTORY',
    sectionIndex: 8,
    number: '8.1',
    text: 'Have you previously been told you do not qualify for a specific payment?',
    hint: 'Past denials can be challenged. We flag appeal rights in your briefing.',
    type: 'choice',
    options: ['Yes', 'No'],
    next: (a) => a === 'Yes' ? 'history.denied_what' : 'history.upload'
  },
  {
    id: 'history.denied_what',
    section: 'HISTORY',
    sectionIndex: 8,
    number: '8.2',
    text: 'Which payment were you told you did not qualify for?',
    type: 'choice',
    options: [
      'Accommodation Supplement',
      'Disability Allowance',
      'Temporary Additional Support',
      'Childcare Assistance',
      'Child Disability Allowance',
      'Supported Living Payment',
      'Winter Energy Payment',
      'Special Needs Grant',
      'Other'
    ],
    next: () => 'history.written'
  },
  {
    id: 'history.written',
    section: 'HISTORY',
    sectionIndex: 8,
    number: '8.3',
    text: 'Were you given a written reason for the decision?',
    type: 'choice',
    options: ['Yes — in writing', 'No — verbal only', 'No reason given'],
    next: () => 'history.upload'
  },
  {
    id: 'history.upload',
    section: 'HISTORY',
    sectionIndex: 8,
    number: '8.4',
    text: 'Do you have past MSD letters or decision notices?',
    type: 'upload',
    options: ['Upload a document', 'Skip for now'],
    next: () => 'situation.emergency'
  },

  // ── SITUATION ──
  {
    id: 'situation.emergency',
    section: 'SITUATION',
    sectionIndex: 9,
    number: '9.1',
    text: 'Are you currently in an emergency or crisis situation?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'situation.family_violence'
  },
  {
    id: 'situation.family_violence',
    section: 'SITUATION',
    sectionIndex: 9,
    number: '9.2',
    text: 'Are you or your family affected by family violence?',
    type: 'choice',
    options: ['Yes', 'No', 'Prefer not to say'],
    next: () => 'situation.recently_released'
  },
  {
    id: 'situation.recently_released',
    section: 'SITUATION',
    sectionIndex: 9,
    number: '9.3',
    text: 'Have you recently been released from prison or a corrections facility?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'situation.refugee'
  },
  {
    id: 'situation.refugee',
    section: 'SITUATION',
    sectionIndex: 9,
    number: '9.4',
    text: 'Are you a refugee or asylum seeker who has recently arrived in NZ?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => 'situation.carer'
  },
  {
    id: 'situation.carer',
    section: 'SITUATION',
    sectionIndex: 9,
    number: '9.5',
    text: 'Are you a full-time carer for someone with a serious health condition or disability?',
    type: 'choice',
    options: ['Yes', 'No'],
    next: () => null  // null = intake complete
  }
]

export const questionsById = Object.fromEntries(questions.map(q => [q.id, q]))

export const FIRST_QUESTION_ID = questions[0].id
