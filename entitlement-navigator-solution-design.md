# ENTITLEMENT NAVIGATOR — SOLUTION DESIGN
## NZ Social Security Act 2018 · Zero-Knowledge Architecture · MVP

---

## REPLIT AGENT SCAFFOLD PROMPT

> Paste the following block directly into Replit Agent to scaffold the project.

---

```
Build a full-stack web application called "Entitlement Navigator" using the following exact specification. Do not deviate from the stack, file structure, or architecture described. Read the entire spec before writing any code.

## STACK
- Runtime: Node.js 20
- Frontend: React 18 + TypeScript + Vite
- Styling: Plain CSS with CSS custom properties (no Tailwind, no CSS-in-JS)
- State: React useState + useReducer (no Redux, no Zustand)
- Rules engine: json-rules-engine (npm)
- Search: @orama/orama (npm) — client-side only
- PDF parsing: pdfjs-dist (npm) — client-side only
- PDF generation: pdf-lib (npm) — client-side only
- Document signing: Web Crypto API (built-in, no library)
- Server: Hono (npm)
- Database ORM: drizzle-orm + better-sqlite3 (npm)
- Fonts: IBM Plex Sans, IBM Plex Mono, Antonio — Google Fonts CDN

## CRITICAL ARCHITECTURE CONSTRAINTS
1. Personal data NEVER touches the server. All intake logic, rules evaluation, document assembly, and signing runs in the browser only.
2. The server has exactly TWO API endpoints: POST /api/sign and POST /api/outcome.
3. The database has exactly ONE table: outcomes (entitlement_type, outcome_code, week). No user IDs, no session IDs, no timestamps beyond week number.
4. Anthropic API is NOT called at runtime. No AI calls in the running application.
5. Every server-side API file must have a comment at the top: "// ZERO KNOWLEDGE: this endpoint [description of what it does and does not persist]"

## FILE STRUCTURE
Create exactly this structure:

entitlement-navigator/
├── client/
│   ├── src/
│   │   ├── main.tsx                    # React entry point
│   │   ├── App.tsx                     # Root component, screen router
│   │   ├── styles/
│   │   │   └── global.css              # All CSS variables and base styles
│   │   ├── components/
│   │   │   ├── Header.tsx              # LCARS-style header bar
│   │   │   ├── Sidebar.tsx             # Progress + live entitlement preview
│   │   │   ├── ScreenTabs.tsx          # Intake / Assessment / Document tabs
│   │   │   ├── intake/
│   │   │   │   ├── IntakeScreen.tsx    # Question display and flow
│   │   │   │   ├── QuestionBlock.tsx   # Individual question renderer
│   │   │   │   └── AnswerOptions.tsx   # Choice buttons + text/number input
│   │   │   ├── assessment/
│   │   │   │   ├── AssessmentScreen.tsx
│   │   │   │   └── EntitlementCard.tsx # Entitled / Possible / Unknown card
│   │   │   └── document/
│   │   │       └── DocumentScreen.tsx  # Signed document view + download
│   │   ├── hooks/
│   │   │   ├── useIntake.ts            # Branching intake state machine
│   │   │   ├── useRulesEngine.ts       # json-rules-engine wrapper
│   │   │   └── useDocumentSigning.ts   # Web Crypto sign + verify
│   │   ├── engine/
│   │   │   ├── questions.ts            # All intake questions + branching logic
│   │   │   ├── rules.ts                # Entitlement rules (SSA 2018)
│   │   │   └── knowledge.ts            # Orama index init + search
│   │   ├── lib/
│   │   │   ├── pdfParser.ts            # pdfjs-dist client-side parsing
│   │   │   ├── pdfGenerator.ts         # pdf-lib document assembly
│   │   │   └── types.ts                # Shared TypeScript types
│   │   └── knowledge-base/
│   │       ├── ssa-2018.md             # Social Security Act 2018 excerpts
│   │       ├── map-policies.md         # Work and Income MAP policy excerpts
│   │       └── rates.md                # Current rates and thresholds
├── server/
│   ├── index.ts                        # Hono server entry, mounts routes
│   ├── routes/
│   │   ├── sign.ts                     # POST /api/sign — stateless signing pipe
│   │   └── outcome.ts                  # POST /api/outcome — two field DB write
│   ├── db/
│   │   ├── schema.ts                   # Drizzle schema — outcomes table only
│   │   └── index.ts                    # DB connection
│   └── lib/
│       └── signing.ts                  # ECDSA key operations using node:crypto
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PRIVACY.md                          # Zero-knowledge guarantee documentation

## CSS DESIGN SYSTEM

In client/src/styles/global.css define these exact CSS custom properties:

:root {
  --bg:           #0d1117;
  --bg2:          #111822;
  --bg3:          #16202e;
  --panel:        #0a1628;
  --border:       #1a2f4a;
  --border2:      #243d5c;
  --text:         #cdd9e8;
  --text-dim:     #4a6480;
  --text-bright:  #e8f2ff;
  --gold:         #e8b84b;
  --gold-dim:     rgba(232,184,75,0.12);
  --gold-border:  rgba(232,184,75,0.35);
  --teal:         #4fc3d4;
  --teal-dim:     rgba(79,195,212,0.1);
  --teal-border:  rgba(79,195,212,0.3);
  --blue:         #7eb8f7;
  --accent:       #5b9bd5;
  --accent-glow:  rgba(91,155,213,0.15);
  --grey:         #4a6480;
  --grey-dim:     rgba(74,100,128,0.1);
  --green:        #98c379;
  --red:          #e06c75;
  --font-display: 'Antonio', sans-serif;
  --font-body:    'IBM Plex Sans', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;
}

Apply these design rules globally:
- body: background var(--bg), color var(--text), font-family var(--font-body)
- All headers and labels: font-family var(--font-display), letter-spacing 2-3px, text-transform uppercase
- All data, citations, code, legal references: font-family var(--font-mono)
- App layout: CSS grid, two columns (280px sidebar + 1fr main), header spanning full width
- No rounded corners anywhere except 2px maximum
- Buttons use clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%) for LCARS feel
- Status colours are semantic only: gold=entitled, teal=possible, grey=unknown, green=verified

## DATABASE SCHEMA

In server/db/schema.ts implement exactly:

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const outcomes = sqliteTable('outcomes', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  entitlement_type: text('entitlement_type', { length: 100 }).notNull(),
  outcome_code:     text('outcome_code', { length: 20 }).notNull(),
  week:             text('week', { length: 7 }).notNull()
  // week format: 'YYYY-WW' e.g. '2026-W12'
  // No user ID. No session ID. No precise timestamp. No office. No name.
  // Re-identification risk: nil.
})

Valid outcome_code values: GRANTED | DENIED | NOT_ASSESSED | DEFERRED | DEFLECTED

## API ENDPOINTS

### POST /api/sign
- Receives: { document: object } — the assembled entitlement brief
- Signs with ECDSA P-256 using private key from environment variable SIGNING_KEY
- Returns: { signature: string, publicKey: string }
- Does NOT log, store, or inspect the document contents
- Comment at top: "// ZERO KNOWLEDGE: receives document object, returns signature, persists nothing"

### POST /api/outcome
- Receives: { entitlement_type: string, outcome_code: string }
- Validates outcome_code is one of the five valid values
- Writes one row to outcomes table with current week number
- Returns: { ok: true }
- Comment at top: "// ZERO KNOWLEDGE: writes two anonymous fields only, no session linkage possible"

## INTAKE STATE MACHINE

In client/src/hooks/useIntake.ts implement:

type Question = {
  id: string
  section: string
  number: string
  text: string
  type: 'choice' | 'number' | 'boolean' | 'text'
  options?: string[]
  unit?: string
  next: (answer: unknown) => string | null  // returns next question id or null if complete
}

type IntakeState = {
  answers: Record<string, unknown>
  history: string[]
  currentId: string
  isComplete: boolean
}

The hook must expose: { current, answers, answer(value), back(), isComplete, progress }
progress is a number 0-100 based on history length vs estimated total questions.

## INTAKE QUESTIONS

In client/src/engine/questions.ts define at minimum these questions with correct branching:

Sections: HOUSING → INCOME → HEALTH → CHILDREN → HISTORY → (complete)

HOUSING questions:
- housing.type: "Are you currently renting, boarding, or paying a mortgage?" [Renting, Boarding, Mortgage, None of these]
- housing.rent: "How much do you pay per week?" (number, unit: $/wk) — if renting or boarding
- housing.region: "Which region do you live in?" (choice: Auckland/Wellington/Canterbury/Other) — affects accommodation supplement zone

INCOME questions:
- income.employed: "Are you currently employed?" [Yes, No]
- income.hours: "How many hours per week do you work?" (number, unit: hrs/wk) — if yes
- income.amount: "What is your weekly income before tax?" (number, unit: $/wk) — if yes
- income.benefit: "Are you currently receiving any main benefit?" [Yes, No]
- income.benefit_type: "Which benefit?" [Jobseeker Support, Sole Parent Support, Supported Living Payment, Other] — if yes

HEALTH questions:
- health.condition: "Do you have a health condition or disability affecting your daily life?" [Yes, No]
- health.costs: "Does this result in regular ongoing costs — medical, transport, equipment?" [Yes, No] — if yes
- health.hours_able: "How many hours per week are you able to work regularly?" [Unable to work, Less than 15 hrs, 15-30 hrs, More than 30 hrs] — if yes

CHILDREN questions:
- children.dependent: "Do you have dependent children living with you?" [Yes, No]
- children.count: "How many?" (number) — if yes
- children.ages: "Ages of youngest and oldest?" (text) — if yes
- children.childcare: "Are any children under 5 attending early childhood education?" [Yes, No] — if yes
- children.disability: "Does any child have a serious disability requiring extra care?" [Yes, No] — if yes

HISTORY questions:
- history.past_denied: "Have you previously been told you don't qualify for a specific payment?" [Yes, No]
- history.denied_what: "Which payment were you told you didn't qualify for?" (text) — if yes
- history.written: "Were you given a written reason?" [Yes, No, Verbal only] — if yes
- history.upload: "Do you have any past MSD letters or decision notices? You can upload them — they stay in your browser only." [Upload file, Skip]

## RULES ENGINE

In client/src/engine/rules.ts define json-rules-engine rules for these entitlements:

1. ACCOMMODATION_SUPPLEMENT
   Conditions: housing.type in [Renting, Boarding, Mortgage] AND income below threshold for region
   Confidence: HIGH if all conditions met, MEDIUM if income close to threshold

2. WINTER_ENERGY_PAYMENT  
   Conditions: income.benefit is true
   Confidence: HIGH

3. TEMPORARY_ADDITIONAL_SUPPORT
   Conditions: income below threshold AND health.costs is true OR housing costs exceed 30% of income
   Confidence: MEDIUM — discretionary, always flag as "raise at appointment"

4. DISABILITY_ALLOWANCE
   Conditions: health.condition is true AND health.costs is true
   Confidence: MEDIUM — requires GP evidence

5. CHILDCARE_ASSISTANCE
   Conditions: children.childcare is true AND income below threshold
   Confidence: HIGH if conditions met

6. CHILD_DISABILITY_ALLOWANCE
   Conditions: children.disability is true
   Confidence: HIGH

Each rule result must include:
- entitlement_type: string (enum value)
- status: 'ENTITLED' | 'POSSIBLE' | 'INSUFFICIENT_INFORMATION'
- confidence: number (0-100)
- legal_basis: string (e.g. "s73 Social Security Act 2018")
- weekly_amount: string (e.g. "up to $305")
- action: string (specific instruction for the WINZ appointment)

## SIGNED DOCUMENT FORMAT

In client/src/lib/types.ts define:

type EntitlementResult = {
  entitlement_type: string
  status: 'ENTITLED' | 'POSSIBLE' | 'INSUFFICIENT_INFORMATION'
  confidence: number
  legal_basis: string
  weekly_amount?: string
  action: string
}

type SignedDocument = {
  version: string           // rules engine version e.g. "SSA-2024.Q4"
  generated: string         // ISO date only, no time
  circumstances: Record<string, unknown>  // intake answers
  entitlements: EntitlementResult[]
  brief: string             // human-readable appointment preparation text
  signature: string         // ECDSA P-256 base64
  publicKey: string         // for browser-side verification
}

The document is downloaded as a JSON file. The filename format: entitlement-brief-YYYY-MM-DD.json

## DOCUMENT SIGNING FLOW

In client/src/hooks/useDocumentSigning.ts:

sign(document: object): 
  1. POST to /api/sign with document
  2. Receive { signature, publicKey }
  3. Return complete SignedDocument with signature embedded

verify(signedDoc: SignedDocument): 
  1. Use Web Crypto API in browser
  2. Import publicKey from signedDoc
  3. Verify signature against document contents (excluding signature field)
  4. Return boolean

## POST-APPOINTMENT OUTCOME LOGGING

After assessment, show a single follow-up section titled "After your appointment":
- For each ENTITLED or POSSIBLE entitlement in the assessment
- Show the entitlement name and a dropdown: [Select outcome... / GRANTED / DENIED / NOT_ASSESSED / DEFERRED / DEFLECTED]
- One "Submit outcomes" button that POSTs each completed outcome to /api/outcome
- No compulsion — clearly marked optional
- Copy: "Your response is anonymous. No personal data is sent. Two words only: what you raised and what happened."

## PRIVACY.MD

Create a PRIVACY.md file with this exact content:

# Zero-Knowledge Guarantee

## What we hold
- An aggregate log of entitlement types and outcomes. Two fields. No personal data.
- The server's ECDSA signing public key.

## What we do not hold  
- Your name, address, or contact details
- Your income, benefit status, or health information
- Any session identifier that could link outcome data to you
- Any uploaded documents (parsed in your browser, never transmitted)

## How to verify this
1. The codebase is open source
2. The database schema is in server/db/schema.ts — one table, three fields
3. Every API route has a comment stating what it persists
4. The server has two routes. That is the entire backend.

## The signed document
The document you download is the only persistent record of your assessment.
It lives on your device. We cannot access it.
The signature allows you to verify it was generated by this system
and to resume your session by uploading it on a return visit.

## PACKAGE.JSON DEPENDENCIES

{
  "dependencies": {
    "hono": "^4.0.0",
    "drizzle-orm": "^0.30.0",
    "better-sqlite3": "^9.0.0",
    "json-rules-engine": "^7.3.0",
    "@orama/orama": "^3.0.0",
    "pdfjs-dist": "^5.0.0",
    "pdf-lib": "^1.17.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "@types/better-sqlite3": "^7.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}

## ENVIRONMENT VARIABLES

Create a .env.example with:
SIGNING_KEY=        # ECDSA P-256 private key in PKCS8 PEM format
DATABASE_URL=       # Path to SQLite file e.g. ./data/outcomes.db
PORT=3000

## WHAT TO BUILD FIRST — SEQUENCE

Build in this exact order. Do not skip ahead.

1. Project scaffold — package.json, tsconfig.json, vite.config.ts, folder structure
2. Server — Hono entry, DB schema, drizzle migration, /api/sign stub, /api/outcome stub  
3. CSS design system — global.css with all variables, base reset, typography
4. Header and Sidebar components — static, no logic
5. useIntake hook — state machine with all questions and branching
6. IntakeScreen — renders questions from useIntake, handles answers
7. useRulesEngine hook — wraps json-rules-engine, returns EntitlementResult[]
8. AssessmentScreen — renders EntitlementCard components from rules output
9. useDocumentSigning hook — calls /api/sign, assembles SignedDocument
10. DocumentScreen — renders signed document, download button
11. Post-appointment outcome section — outcome dropdowns, calls /api/outcome
12. PRIVACY.md

Do not implement PDF upload or PDF parsing in the MVP. Mark the upload question as "coming soon" with a placeholder.
Do not implement Orama knowledge base search in the MVP. Mark as "coming soon".
Do not implement return-visit document verification in the MVP. Mark as "coming soon".

These three features are Phase 2.

## FINAL CHECK BEFORE SUBMITTING CODE

Before outputting any file, verify:
- [ ] Server has exactly 2 route files
- [ ] Database schema has exactly 1 table with 3 fields (id excluded)
- [ ] No personal data is imported, logged, or stored anywhere in server/
- [ ] Every component uses CSS custom properties only — no hardcoded colour values
- [ ] Antonio font is used for all labels, headings, badges
- [ ] IBM Plex Mono is used for all data, legal citations, code values
- [ ] The word "sorry" does not appear anywhere in the UI copy
- [ ] The phrase "We're here to help" does not appear anywhere in the UI copy
- [ ] All UI copy is direct, terse, factual — no marketing language
```

---

## PHASE 2 FEATURES (post-MVP)

These are out of scope for the initial scaffold but must be architecturally accommodated.

| Feature | Status | Notes |
|---|---|---|
| Full NZ benefit dataset | **DONE** | 70 benefits across 9 categories, YAML → JSON pipeline |
| Generic rules engine | **DONE** | Data-driven evaluator, replaced hardcoded if/else |
| Expanded intake (8 sections) | **DONE** | 44 questions covering personal, employment, situation |
| Rate table integration | TODO | Wire `data/rates/` into evaluation for precise amounts |
| Friction metadata in UI | TODO | Surface docs required, processing time, known issues on cards |
| Income/asset test logic | TODO | Apply thresholds from benefit definitions to confidence scores |
| PDF upload + client-side parsing | TODO | `pdfjs-dist` already in deps, intake question is a placeholder |
| Return visit document verification | TODO | Web Crypto verify already designed in `useDocumentSigning` |
| Orama knowledge base search | TODO | Index init in `knowledge.ts`, not wired to UI yet |
| Mobile layout | TODO | Full-width, collapsible sidebar, one-question-per-screen flow |
| Knowledge base update pipeline | **PARTIALLY DONE** | YAML data pipeline exists; quarterly rate update process TBD |
| Aggregate reporting export | TODO | CSV export of outcomes JSONL for OIA/advocacy use |
| Outcome analytics | TODO | Surface deflection/denial patterns across entitlement types |
| Multi-language support | TODO | te reo Maori translations for intake questions |

---

## FOLLOW-UP PROMPTS

Use these as sequential Replit Agent prompts after the scaffold is complete.

### Prompt 2 — Wire the rules engine to the intake

```
The intake state machine is working. Now wire useRulesEngine to the intake answers.

1. In useRulesEngine.ts, consume the answers object from useIntake
2. Map answers to the fact structure expected by json-rules-engine
3. Run all 6 entitlement rules against the facts
4. Return an array of EntitlementResult objects
5. Pass results to AssessmentScreen via props
6. Update Sidebar to show live preview of results as questions are answered
7. Results should update in real time as each answer is submitted — not just at completion
```

### Prompt 3 — Document assembly and signing

```
Rules engine is producing results. Now implement document assembly and signing.

1. In pdfGenerator.ts, implement assembleDocument(answers, entitlements) → SignedDocument (pre-signature)
2. The brief field should be a human-readable paragraph summarising what to say at the WINZ appointment
3. In useDocumentSigning.ts, implement sign() — POST to /api/sign, receive signature, return complete SignedDocument
4. In DocumentScreen, render the SignedDocument in the terminal-style format from the prototype
5. Implement the download button — triggers JSON file download named entitlement-brief-YYYY-MM-DD.json
6. Show the truncated signature and public key at the bottom of the document view
7. Implement the /api/sign endpoint on the server using the SIGNING_KEY environment variable
```

### Prompt 4 — Outcome logging

```
Document download is working. Now implement post-appointment outcome logging.

1. Below the assessment cards, add a section titled "AFTER YOUR APPOINTMENT"
2. Eyebrow text: "Optional · Anonymous · Two words sent"  
3. For each ENTITLED or POSSIBLE result, render: entitlement name + outcome selector
4. Outcome selector options: [— / GRANTED / DENIED / NOT_ASSESSED / DEFERRED / DEFLECTED]
5. One submit button. Disabled until at least one outcome is selected.
6. On submit, POST each selected outcome to /api/outcome — one request per entitlement
7. On success, replace the section with: "Recorded. Thank you."
8. On error, show: "Could not send. Your assessment is not affected."
9. Wire /api/outcome on the server to write to the outcomes table
```

### Prompt 5 — Mobile layout

```
Desktop layout is complete. Now implement mobile layout.

Target: 375px minimum width, one-handed operation, low-end Android.

1. Below 768px viewport width:
   - Hide sidebar completely
   - Show a progress strip at top: section name + step count e.g. "HEALTH · 3 of 5"
   - Intake questions display one at a time, full width
   - Answer buttons stack vertically, full width, minimum 48px touch target
   - Assessment cards stack single column
   - Document screen is scrollable single column
2. Navigation: Back button bottom-left, Continue/Next bottom-right — fixed to bottom of viewport
3. Header collapses to logo only on mobile
4. Fonts scale down: Antonio headers 18px mobile vs 28px desktop
5. No horizontal scroll anywhere
```

---

## KNOWLEDGE BASE SOURCES

When populating `client/src/knowledge-base/`, use these primary sources:

| File | Source |
|---|---|
| `ssa-2018.md` | [legislation.govt.nz/act/public/2018/0032](https://legislation.govt.nz/act/public/2018/0032) — Parts 1, 2, 3 |
| `map-policies.md` | [workandincome.govt.nz/map](https://www.workandincome.govt.nz/map/index.html) — hardship, supplementary |
| `rates.md` | [workandincome.govt.nz/on-a-benefit/rates](https://www.workandincome.govt.nz/on-a-benefit/rates/index.html) |

All sources are public domain Crown copyright, freely usable.

---

## DESIGN PRINCIPLES — ENFORCED IN CODE

These are not preferences. They are constraints that must be reflected in the actual UI copy and component logic.

1. **No marketing language** — every string in the UI must be factual and direct
2. **No false warmth** — no exclamation marks, no emoji, no "Great!", no "You're doing well"
3. **No apology** — the tool does not apologise. It informs.
4. **Terse** — if a sentence can lose a word, it loses the word
5. **Cite the law** — every entitlement result must show its legal basis (section + Act)
6. **Exit is the goal** — the document ends with: "Use this to get what you are owed. Then move on."

---

## OUTCOME CODES — DEFINITIONS

| Code | Meaning |
|---|---|
| `GRANTED` | Entitlement was assessed and approved |
| `DENIED` | Entitlement was assessed and refused |
| `NOT_ASSESSED` | Entitlement was raised but case manager declined to assess it |
| `DEFERRED` | Case manager asked you to come back or reapply |
| `DEFLECTED` | Case manager changed the subject or redirected without assessing |

`NOT_ASSESSED`, `DEFERRED`, and `DEFLECTED` are the signal. High rates of these on specific entitlements indicate systematic non-assessment — the advocacy dataset.

---

## VERSION CONTROL

Initialise a git repository. First commit message:

```
init: entitlement navigator MVP scaffold

Zero-knowledge architecture. No personal data retained server-side.
Two endpoints. One table. Three fields.
```

---

*Document version: 0.2 — Full dataset + generic rules engine*
*Rules version: SSA-2026.Q1*
*Next review: when MSD updates rates (typically April annually)*

---

## CHANGELOG

### v0.2 — Full NZ Benefits Dataset + Expanded Rules Engine (March 2026)

**Data architecture:**
- Created `data/` directory with YAML → JSON build pipeline
- `data/schema/benefit.schema.json` — JSON Schema for validation (ajv 2020-12)
- `data/build.ts` — Build script: reads YAML, validates, outputs `data/dist/{benefits.json, rates.json, types.ts}`
- `data/rates/2026-04-01.yaml` — Rate tables for current period
- `npm run data:build` script added to package.json

**Dataset: 70 benefit YAML files across 9 categories:**
- main (8): Jobseeker Support, Sole Parent Support, Supported Living Payment, Emergency Benefit, Youth Payment, Young Parent Payment, Jobseeker Support Student, SPS Training
- supplements (12): Accommodation Supplement, Disability Allowance, Child Disability Allowance, Temporary Additional Support, Winter Energy Payment, Clothing Allowance, Training Incentive, Away from Home, Special Benefit, Transition to Work, Participation, Telephone
- hardship (3): Special Needs Grant, Recoverable Assistance Programme, Advance Payment
- housing (8): Bond Grant, Rent Arrears, Emergency Housing SNG, Moving Assistance, Tenancy Costs, Transitional Accommodation, Housing Support Products, Relocation Assistance
- family (11): Orphan's Benefit, Unsupported Child's Benefit, Working for Families, Best Start, Childcare Assistance, Funeral Grant, Establishment Grant, School Costs, Family Tax Credit, In-Work Tax Credit, Parental Tax Credit
- employment (14): Flexi-wage, Mana in Mahi, Job Search, Course Participation, Self-Employment Start-up, Seasonal Work, Work Confidence, Skills for Industry, Employment Transition, Work Preparation, Limited Services Volunteer, Seminars, Straight to Work, He Poutama Rangatahi
- health (3): Health Related Costs, Power and Heating Supplement, House Modifications
- residential (5): Residential Care Subsidy, Care Loan, Support Subsidy, Supported Living in Community, Long-term Care
- other (6): Civil Defence Payment, Steps to Freedom, Refugee Emergency Support, Community Services Card, Special Circumstance Assistance, Family Violence Support

**Engine refactor:**
- `client/src/engine/rules.ts` rewritten from hardcoded if/else (7 entitlements) to generic evaluator consuming `benefits.json` (70 entitlements)
- `evaluateRule()` interprets `{fact, op, value}` against facts — supports 10 operators
- `evaluateBenefit()` computes confidence from rule pass ratio, determines ENTITLED/POSSIBLE/INSUFFICIENT_INFORMATION
- `buildFacts()` expanded to derive ~80 facts from intake answers

**Intake expansion:**
- `client/src/engine/questions.ts` expanded from 5 sections / 18 questions to 8 sections / 44 questions
- New sections: PERSONAL (age, residency, relationship), EMPLOYMENT (seeking work, training, seasonal), SITUATION (emergency, family violence, recently released, refugee, carer)
- Existing sections expanded: HOUSING (+social housing, arrears, need to move), INCOME (+assets), HEALTH (+duration, cost types, residential care), CHILDREN (+ages, caring for other)

**Type updates:**
- `EntitlementResult` now includes `name` (human-readable) and `category` fields
- Added `Benefit`, `Rule`, `RuleOp`, `BenefitCategory`, `PaymentFrequency` types to `client/src/lib/types.ts`
- Components updated to use `r.name` for display instead of `formatName(r.entitlement_type)`

**Dependencies added:**
- `js-yaml` — YAML parsing for build script
- `ajv` — JSON Schema validation for build script
- `@types/js-yaml` — TypeScript definitions

### v0.1 — MVP Scaffold (Initial)

- React + Vite + Hono stack
- 5-section intake (Housing, Income, Health, Children, History) with 18 questions
- 7 hardcoded entitlement rules
- ECDSA document signing
- Anonymous outcome logging
- Dark theme LCARS-inspired UI
