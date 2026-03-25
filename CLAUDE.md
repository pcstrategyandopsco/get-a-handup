# Entitlement Navigator

NZ Social Security entitlement gap analyser. Zero-knowledge architecture — no personal data touches the server.

## Project Overview

A client-side tool that guides users through intake questions, evaluates eligibility for ~75 NZ government benefits against machine-readable rules, computes transition-to-work analysis, generates a cryptographically signed briefing document for WINZ appointments, and collects anonymous outcome data.

**Design principles:** No marketing language. No false warmth. Terse. Cite the law. Exit is the goal.

## Architecture

```
entitlement-navigator/
├── client/src/
│   ├── engine/
│   │   ├── questions.ts       # 10 sections, 54 branching intake questions (triage gate + 48 original)
│   │   ├── rules.ts           # Generic rule evaluator consuming benefits.json
│   │   └── transition.ts      # Transition-to-work calculator (abatement, tax, work incentives)
│   ├── components/            # React UI (intake → assessment → document)
│   │   └── assessment/
│   │       ├── AssessmentScreen.tsx   # Main results view with tier cards
│   │       ├── TransitionSection.tsx  # "What if you worked?" comparison table
│   │       └── OutcomeSection.tsx     # Anonymous outcome logging
│   ├── hooks/                 # useIntake, useRulesEngine, useTransition, useDocumentSigning
│   ├── lib/types.ts           # Shared types (EntitlementResult, Benefit, Rule, IncomeScenario, TransitionAnalysis, etc.)
│   └── styles/global.css      # Dark theme, LCARS-inspired design system
├── server/                    # Hono — 2 endpoints only (/api/sign, /api/outcome)
├── data/
│   ├── schema/benefit.schema.json   # JSON Schema for YAML validation
│   ├── benefits/                    # 75 YAML benefit definitions (9 categories)
│   │   ├── main/          (8)      # Jobseeker, SPS, SLP, Youth, Emergency, etc.
│   │   ├── supplements/   (12)     # Accom Supp, DA, CDA, TAS, WEP, etc.
│   │   ├── hardship/      (3)      # SNG, RAP, Advance Payment
│   │   ├── housing/       (8)      # Bond, Arrears, Emergency Housing, etc.
│   │   ├── family/        (12)     # Orphan's, UCB, WFF, Childcare, MFTC, etc.
│   │   ├── employment/    (14)     # Flexi-wage, Mana in Mahi, etc.
│   │   ├── health/        (3)      # Health Costs, Power/Heating, House Mods
│   │   ├── residential/   (5)      # Care Subsidy, Loan, Support, etc.
│   │   └── other/         (10)     # Civil Defence, Steps to Freedom, StudyLink, IETC, etc.
│   ├── rates/2026-04-01.yaml       # Rate tables + abatement + tax brackets + work incentives
│   ├── tools/                       # Data discovery and audit scripts
│   │   ├── audit-completeness.ts    # Checks legal_basis, rules, rates, thresholds
│   │   ├── gap-report.ts            # Compares dataset against known NZ entitlements
│   │   └── validate-thresholds.ts   # Cross-refs thresholds against rate tables
│   ├── build.ts                     # YAML → JSON + TS build script
│   └── dist/                        # Generated: benefits.json, rates.json, types.ts
└── package.json
```

## Key Commands

```bash
npm run dev              # Start client (Vite :5173) + server (Hono :3000)
npm run data:build       # Validate YAML → generate data/dist/{benefits,rates}.json + types.ts
npm run test:scenarios   # Run test scenarios against rules engine
npm run data:audit       # Run audit-completeness + gap-report + validate-thresholds
npm run build            # Production build (client + server)
```

## Test Scenarios

Test scenarios live in `tests/scenarios/*.yaml`. Each defines intake answers and expected entitlements.

```bash
npm run test:scenarios                           # Run all scenarios
npx tsx tests/run-scenarios.ts FILE              # Run one scenario
```

Scenario files include:
- `intake_answers` — maps to question IDs
- `expected_entitlements.should_surface` — benefits that must appear, with expected status
- `expected_entitlements.should_not_surface` — benefits that must NOT appear
- `notes` — real-world context explaining the gap
- `transition_expected` — (transition scenarios only) expected verdict and reasoning

Current scenarios (11):
- `reddit-jobseeker-medical.yaml` — Part-time worker missing supplements
- `reddit-slp-vs-jobseeker-medical.yaml` — SLP candidate gatekept on JS-Medical
- `reddit-js-medical-studying.yaml` — JS-Medical + Masters study, StudyLink pathway
- `reddit-relationship-declaration-on-benefit.yaml` — Relationship declaration risk, partner income impact
- `reddit-benefit-cut-missed-appointment.yaml` — Sanction for missed appointment, notification failure, emergency grants
- Plus 6 additional scenarios covering DA decline, casual-to-permanent work, tax traps, accessibility needs, and transition analysis
- `transition-js-single.yaml` — Single JS no kids, transition trap verdict
- `transition-sps-with-kids.yaml` — SPS with kids, better_working verdict (IWTC + MFTC)

### Grey Areas Inventory

`tests/scenarios/grey-areas.yaml` — NOT a test scenario. A structured inventory of discretionary decision points where MSD judgement determines outcomes. Documents 9 grey areas with law references, MSD practice patterns, financial impact, Reddit evidence, tool gaps, and advocacy points. This is the roadmap for where the tool delivers real value beyond binary rule evaluation.

Grey areas catalogued:
1. **Relationship classification** — s3 SSA 2018, ~$500/wk swing
2. **Work capacity (SLP vs JS-Medical)** — s40 SSA 2018, designated doctor override
3. **Disability Allowance cost categories** — s28A SSA 2018, what's claimable
4. **Temporary Additional Support** — s80 SSA 2018, "essential costs" discretion
5. **Special Needs Grants** — s65 SSA 2018, invisible entitlement
6. **Benefit transitions** — gain/loss analysis when switching pathways
7. **Case manager discretion** — the human variable, information asymmetry
8. **Abatement traps** — Schedule 4 SSA 2018, poverty ceiling
9. **Compliance sanctions** — s102-117 SSA 2018, notification failures, traffic light system, appeal rights

## Data Pipeline

YAML source files → `data/build.ts` (validates against JSON Schema via ajv) → `data/dist/benefits.json`

The rules engine (`client/src/engine/rules.ts`) imports `benefits.json` and evaluates each benefit's `eligibility.rules[]` against facts derived from intake answers. No hardcoded if/else — all logic is data-driven.

### Adding/editing a benefit

1. Edit or create a YAML file in `data/benefits/<category>/`
2. Run `npm run data:build` — must pass with 0 errors
3. The client auto-imports the updated `benefits.json` on next dev reload

### Benefit YAML schema

```yaml
id: kebab-case-id            # Must match filename
name: Human Name
category: main|supplement|hardship|housing|family|employment|health|residential|other
frequency: weekly|fortnightly|one-off|annual|automatic|as-needed
taxable: true|false
legal_basis: "s73 Social Security Act 2018"
description: "Short description"
eligibility:
  min_age: 16
  max_age: null
  residency: [citizen, permanent_resident]
  requires_benefit: false
  rules:
    - fact: housing_type
      op: in                  # eq|neq|in|not_in|gt|gte|lt|lte|exists|not_exists
      value: [renting, boarding, mortgage]
  conditions:
    - "Human-readable condition for display"
rates:
  effective: "2026-04-01"
  max_weekly: "$305"
income_test:
  applies: true
  description: "..."
  thresholds:                 # Optional — populate for main benefits
    - weekly: 160
      abatement_rate: 0.70
friction:
  documentation_required: ["Proof of accommodation costs"]
  typical_processing: "2-4 weeks"
  known_issues: []
  deflection_patterns: []
```

### Rate tables (data/rates/2026-04-01.yaml)

Contains six top-level sections:
- `main_benefits` — base rates by benefit type and demographic
- `accommodation_supplement` — area 1-4 max rates by household type
- `abatement` — per-benefit threshold and rate (JS 70c, SLP/SPS 30c)
- `tax_brackets` — NZ personal income tax rates (10.5% → 39%)
- `acc_levy` — ACC earners' levy rate (1.6%)
- `work_incentives` — IWTC, IETC, MFTC, Accommodation Benefit parameters

### Rule evaluation

- `evaluateRule(rule, facts)` — interprets one `{fact, op, value}` against the facts object
- `evaluateBenefit(benefit, facts)` — runs all rules, computes confidence from pass ratio
  - All pass → ENTITLED (confidence 70-95%)
  - Most pass → POSSIBLE (50-80%)
  - Too few evaluated → INSUFFICIENT_INFORMATION (30-50%)
  - Clearly fails → filtered out
- `buildFacts(answers)` — transforms raw intake answers into ~107 derived facts (including 15 triage facts, `annual_income`, `on_main_benefit`)

## Transition Calculator

**File:** `client/src/engine/transition.ts` — pure functions, no React.

Computes on-benefit vs working scenarios to show the crossover point where working pays more. Uses abatement rates, tax brackets, ACC levy, and work incentive tax credits from the rate tables.

**Core function:** `computeTransition(answers, facts, results, rates) → TransitionAnalysis`

**How it works:**
1. **Current scenario**: Sums benefit + supplements from results. Applies abatement for declared earnings.
2. **Work scenarios** (3): PT min wage 20hrs, FT min wage 40hrs, FT living wage 40hrs. Each computes gross → tax → ACC → abatement → supplement retention → work incentives → net.
3. **Crossover**: Binary search for hourly rate at 40hrs where net_working > net_benefit.
4. **Verdict**: net_gain_at_fulltime < -$20/wk = `trap`, -$20 to +$20 = `marginal`, > $20 = `better_working`

**Work incentives computed:**
- **IWTC** ($72.46/wk) — off-benefit, has children, 20+ hrs (single) or 30+ hrs (couple)
- **IETC** ($520/yr) — off-benefit, income $24k-$48k, no WFF
- **MFTC** (floor $31,096/yr) — off-benefit, has children, 20+ hrs, income below floor

**Key constants:** `MIN_WAGE_2026 = 23.15`, `LIVING_WAGE_2026 = 27.80`

**UI:** `TransitionSection.tsx` renders on the Assessment screen when results include a main benefit. Shows comparison table, crossover line, gains/losses list, housing cliff warning, EMTR bar.

**Hook:** `useTransition(answers, results, enabled)` — statically imports `rates.json`, calls `computeTransition`, returns `{ analysis, isComputing }`. Enabled gate is `results.length > 0` (the hook internally checks for a main benefit).

## Assessment Screen Layout

The assessment screen separates results into distinct tiers:

1. **Current support** — benefits user reported already receiving
2. **You should be receiving** (ENTITLED) — recurring entitlements with high confidence
3. **Worth investigating** (POSSIBLE, ≥65% confidence) — recurring entitlements worth raising
4. **If circumstances change** (contingency) — recurring entitlements needing more info, collapsed by default
5. **Emergency safety net** — one-off grants and hardship provisions (`category === 'hardship'` or `frequency in ['one-off', 'as-needed']`), collapsed by default. Not included in the "Full potential" tier total.
6. **Financial summary** — Current → Conservative → Full potential tier cards. Full potential only includes recurring entitlements.
7. **Transition analysis** — "What if you worked?" section (only when a main benefit surfaces)
8. **Outcome logging** — anonymous outcome recording

## Data Discovery Tooling

Three scripts in `data/tools/`:

- **`audit-completeness.ts`** — checks all 75 benefit YAMLs for: `legal_basis` present, `rules[]` non-empty, `rates` has dollar amounts, `income_test.thresholds` populated when `applies=true`. Exits non-zero when issues found (expected — surfaces known gaps).
- **`gap-report.ts`** — hardcoded list of known NZ entitlements (IRD, ACC, StudyLink, MoH). Compares against existing YAMLs. Outputs missing entitlements by priority.
- **`validate-thresholds.ts`** — cross-refs `income_test.thresholds` in benefit YAMLs against centralized rate table abatement values. Flags mismatches.

Run all three: `npm run data:audit`

## Triage Gate

A single question at the start routes users into the right path:

| Mode | Path | Questions | Result focus |
|------|------|-----------|--------------|
| **Full** | `triage.reason` → all 48 original questions | ~49 | Everything |
| **Crisis** | `triage.reason` → `triage.crisis_needs` → age → residency → housing → arrears → benefit | ~8 | Hardship + housing grants only |
| **Sanctions** | `triage.reason` → sanction_type → notified → written → age → residency → housing → arrears → benefit | ~10 | Emergency grants + appeal rights (s117/s12/s391 SSA 2018) |
| **Appeal** | `triage.reason` → appeal_benefit → age → residency → housing → ... → benefit | ~10 | Declined benefit re-evaluation + ROD guidance |

Crisis/sanctions/appeal paths skip non-essential questions (years_in_nz, relationship, partner, housing cost/region, employment, education, etc.) and end early. Each shows a "Continue full assessment" button to extend to all questions.

**Key functions:**
- `getTriageMode(answers)` — returns `'full' | 'crisis' | 'sanctions' | 'appeal' | null` from `triage.reason` answer
- `next(answer, answers)` — all question routing functions accept the full answers object as second param for path-aware branching
- `continueFullAssessment()` — switches `triage.reason` to full mode, replays from start, stops at first unanswered question

**Crisis/sanctions mode filtering:** `evaluateEntitlements()` filters results to `hardship` + `housing` categories only. Crisis mode also sets `in_emergency`, `has_urgent_need`, `has_essential_need` = true in facts (implied by choosing the crisis path).

**Appeal mode:** puts the declined benefit first in results. Assessment shows ROD (Review of Decision) guidance with s391 citation.

## Intake Sections

| # | Section | Questions | Key facts derived |
|---|---------|-----------|-------------------|
| 0 | TRIAGE | 6 | triage_mode, crisis_needs, sanction_type, appeal_target |
| 1 | PERSONAL | 6 | age, residency, years_in_nz, relationship, partner_income |
| 2 | HOUSING | 6 | housing_type, cost, region, social_housing, arrears |
| 3 | INCOME | 7 | employed, hours, income, benefit_type, assets, annual_income, on_main_benefit |
| 4 | HEALTH | 6 | condition, duration, costs, cost_types, work_capacity |
| 5 | CHILDREN | 6 | child_count, ages, childcare, disability, caring_for_other |
| 6 | EDUCATION | 4 | is_student, study_level, study_load, is_postgrad, study_papers |
| 7 | EMPLOYMENT | 5 | seeking_work, duration, training, seasonal, self_employed |
| 8 | HISTORY | 4 | past_denied, denied_what, written_reason |
| 9 | SITUATION | 5 | emergency, family_violence, recently_released, refugee, carer |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Hono (Node.js) — stateless, 2 endpoints
- **Styling:** Vanilla CSS with design tokens (dark theme, LCARS-inspired)
- **Storage:** Flat-file JSONL (outcomes only — anonymous)
- **Signing:** ECDSA P-256 via node:crypto
- **Data:** YAML → JSON via js-yaml + ajv validation

## Zero-Knowledge Guarantees

- All rules evaluation happens client-side in the browser
- Transition calculator runs client-side using statically imported rate tables
- Server has 2 endpoints: `/api/sign` (returns signature, persists nothing) and `/api/outcome` (writes 3 anonymous fields: entitlement_type, outcome_code, week)
- No user accounts, sessions, cookies, or PII storage
- The signed document lives on the user's device only

## Conventions

- **No emoji** in UI copy unless user requests it
- **No marketing language** — factual, terse, direct
- **Cite the law** — every entitlement shows its legal basis
- **Font usage:** Outfit — single typeface at different weights (200-800). Weights create hierarchy: 700-800 headings, 500-600 labels/buttons, 400 body/data, 300 secondary text
- **Status colours:** gold = ENTITLED, teal = POSSIBLE, grey = INSUFFICIENT
- **Verdict colours:** green = better_working, gold = marginal, red = trap
- **Benefit IDs:** kebab-case (e.g. `accommodation-supplement`), converted to UPPER_SNAKE_CASE for `entitlement_type`
- **Emergency vs recurring:** `EntitlementResult.frequency` distinguishes one-off/as-needed from weekly/fortnightly/annual. Emergency items are separated in the UI and excluded from financial tier totals.

## What's Implemented (as of March 2026)

- [x] Full data pipeline: 75 YAML benefits → JSON Schema validation → benefits.json
- [x] Rate tables (2026-04-01) with abatement rates, tax brackets, ACC levy, work incentives
- [x] Generic rules engine (data-driven, no hardcoded if/else)
- [x] 10-section intake with 54 branching questions (triage gate + 48 original + EDUCATION section for StudyLink pathway)
- [x] **Triage gate** — single entry question routes into Full / Crisis (~8 Qs) / Sanctions (~10 Qs) / Appeal (~10 Qs) paths
- [x] **Crisis mode** — fast-path to hardship + housing grants, skips non-essential sections
- [x] **Sanctions mode** — emergency grants + numbered advocacy steps (s117/s12/s391 SSA 2018 citations), notification failure detection
- [x] **Appeal mode** — declined benefit re-evaluation + Review of Decision guidance
- [x] **Continue full assessment** — extend any focused path to all 48 questions without losing answers
- [x] Real-time evaluation with debounced sidebar preview
- [x] Assessment screen with separated recurring/emergency tiers
- [x] **Transition calculator** — on-benefit vs working comparison with EMTR, crossover point, IWTC/IETC/MFTC, housing cliff warning, trap/marginal/better_working verdict
- [x] **Emergency safety net section** — one-off grants and hardship provisions separated from recurring entitlement totals
- [x] **Data discovery tooling** — audit-completeness, gap-report, validate-thresholds (`npm run data:audit`)
- [x] **New benefits** — Independent Earner Tax Credit (IETC), Minimum Family Tax Credit (MFTC)
- [x] Cryptographically signed briefing document
- [x] Anonymous outcome logging (GRANTED/DENIED/NOT_ASSESSED/DEFERRED/DEFLECTED)
- [x] Dark theme UI with responsive layout
- [x] 11 test scenarios (including 2 transition analysis scenarios)

## Next Steps

### Phase 2 — Grey area warnings (remaining)
- [ ] **Relationship question refactor** — distinguish dating/casual from de facto/cohabiting; warn about s3 SSA 2018 factors and financial impact of declaration
- [ ] **Partner income modelling** — apply partner income testing to main benefits; flag risk of reduction/cancellation when has_partner=true and partner_income is high
- [ ] **JS vs JS-Medical vs SLP pathway** — when has_condition=true and work capacity is limited, surface JS-Medical variant and SLP threshold guidance
- [ ] **Benefit transition analysis** — when person qualifies for alternate benefit, show gain/loss comparison (especially benefit→StudyLink housing support drop)
- [ ] **DA cost category checklist** — when DA surfaces, show eligible cost categories with examples (transport, power, diet, gender-affirming care)
- [ ] **TAS cost breakdown builder** — guide user through essential cost inventory to prepare for appointment
- [ ] **SNG category listing** — surface what can be granted (food, whiteware, school costs, etc.)

### Phase 2 — Data and infrastructure (remaining)
- [ ] **Friction metadata in UI** — surface `documentation_required`, `typical_processing`, `known_issues` on EntitlementCards
- [ ] **Income/asset test logic** — apply income_test and asset_test thresholds from benefit definitions to adjust confidence scores
- [ ] **Populate missing thresholds** — 65 benefits have `income_test.applies=true` but no thresholds (run `npm run data:audit` to see)
- [ ] **Fill gap report** — 11 known NZ entitlements not yet in dataset (3 high priority: Best Start, PPL, Transitional Housing)

### Phase 3 — Advocacy support
- [ ] **"What to say" scripts** — per-entitlement appointment guidance with SSA section citations
- [ ] **Knowledge base search** — @orama/orama is in deps; index SSA 2018 excerpts for contextual help
- [ ] **Aggregate reporting** — CSV export of outcomes JSONL for OIA/advocacy use
- [ ] **Outcome analytics** — surface deflection/denial patterns across entitlement types

### Phase 4 — Platform
- [ ] **PDF upload + parsing** — pdfjs-dist is in deps; parse MSD letters client-side to pre-fill intake
- [ ] **Return visit** — verify signed document via Web Crypto API, restore session from JSON upload
- [ ] **Mobile layout** — collapsible sidebar, one-question-per-screen below 768px
- [ ] **Quarterly rate updates** — process for updating rates YAML when MSD publishes new rates (typically April)
- [ ] **Multi-language support** — te reo Maori translations for intake questions
