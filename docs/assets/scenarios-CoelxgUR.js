import{l as a}from"./index-B7JzHyiN.js";const s=`# Grey Areas: Where MSD Discretion and Judgement Determine Outcomes
#
# This file catalogues the grey areas in NZ welfare — the places where
# the law says one thing but MSD practice produces another, where a case
# manager's subjective judgement can swing outcomes by hundreds of dollars
# per week, and where beneficiaries lose out because they don't know the
# rules well enough to push back.
#
# These are NOT test scenarios. They are a structured inventory of the
# discretionary decision points the tool must eventually help people
# navigate. Each grey area is sourced from Reddit threads, legal analysis,
# or known MSD practice patterns.
#
# This is where the tool will eventually deliver real benefit: not just
# "you qualify for X" but "here's the grey area, here's what MSD will
# likely argue, here's the legal basis for pushing back, and here's what
# to say at your appointment."

# ═══════════════════════════════════════════════════════════════════════
# 1. RELATIONSHIP CLASSIFICATION
# ═══════════════════════════════════════════════════════════════════════

relationship_classification:
  law: "s3 Social Security Act 2018 — 'relationship in the nature of marriage'"
  statutory_factors:
    - "living together in the same household"
    - "financial interdependence — shared bank accounts, expenses, assets"
    - "commitment to a shared life"
    - "care of children together"
    - "public reputation as a couple"
  msd_practice:
    - "Applies factors far more aggressively than the statute suggests"
    - "Sexual engagement alone treated as evidence of relationship"
    - "Social media activity used as evidence (photos, relationship status)"
    - "Electoral roll address matching used to flag cohabitation"
    - "A single use of the word 'girlfriend' or 'partner' in any MSD interaction can trigger investigation"
    - "Ace/asexual people classified as 'in a relationship' despite no sexual component"
  financial_impact:
    single_js_rate: "$337.74/wk"
    couple_js_rate: "$562.18/wk combined ($281.09 each)"
    partner_earning_67500: "Benefit reduced to $0 — partner income exceeds abatement threshold"
    swing: "~$500+/wk total support (incl supplements) to $0"
  reddit_evidence:
    - source: "r/newzealand — 'Relationships when on the benefit'"
      upvotes: 36
      consensus: "Don't declare until living together (162 upvotes on top comment)"
      key_quote: "I'm ace, and they declared me and my ex as a couple, even though we didn't have sex, didn't live together, and didn't share expenses"
  tool_gaps:
    - id: relationship-question-too-simple
      current: "Single / In a relationship-de facto / Married / Separated / Widowed"
      needed: |
        Must distinguish:
        1. Single (no romantic partner)
        2. Dating / casual (not cohabiting, no financial interdependence)
        3. De facto / cohabiting (shared household — MSD counts this)
        4. Married / civil union
        Options 2 and 3 have radically different benefit implications but
        are currently conflated into one choice.
    - id: partner-income-not-modelled
      current: "No benefit rules use has_partner or household_income"
      needed: "Partner income testing for all main benefits. Flag risk of reduction/cancellation."
    - id: no-relationship-risk-warning
      current: "Tool gives no guidance on relationship declaration"
      needed: |
        Surface the s3 SSA 2018 factors so people can self-assess.
        Warn about the financial impact before they answer the question.
        Note: the tool should inform, not advise concealment.
  advocacy_points:
    - "All five statutory factors must be considered together — no single factor is determinative"
    - "Not living together weighs heavily against classification as a 'relationship in the nature of marriage'"
    - "Financial independence (separate accounts, no shared expenses) is strong counter-evidence"
    - "Request the written decision citing which specific factors MSD relied on"
    - "Right to review under s12 SSA 2018 if classification is disputed"

# ═══════════════════════════════════════════════════════════════════════
# 2. WORK CAPACITY ASSESSMENT — SLP vs JS-MEDICAL
# ═══════════════════════════════════════════════════════════════════════

work_capacity_assessment:
  law: "s40 Social Security Act 2018 — work capacity restricted to <15hrs/wk"
  grey_area: |
    The law says: if a health condition restricts work capacity to <15hrs/wk,
    SLP must be granted. There is no discretion in the statute — if the medical
    threshold is met, the benefit follows. But MSD interprets "work capacity"
    subjectively through their designated doctor system, which can override
    the treating clinician's opinion.
  msd_practice:
    - "MSD designated doctor can override GP/specialist assessment of work capacity"
    - "Assessment focuses on capacity for ANY work, not the person's actual occupation or skills"
    - "People kept on JS-Medical for years despite meeting SLP criteria"
    - "'Incredibly difficult to get granted even if doctors sign it off' — Reddit"
    - "13-week medical certificate renewal cycle creates constant churn and anxiety"
    - "Case managers may discourage SLP applications ('you're doing fine on JS')"
  financial_impact:
    js_medical_rate: "$337.74/wk"
    slp_rate: "$371.52/wk"
    base_difference: "$33.78/wk"
    abatement_difference: "JS 70c/$1 vs SLP 30c/$1 above threshold"
    if_working_10hrs_at_25:
      js_net_gain: "~$45/wk (after 70% abatement + tax)"
      slp_net_gain: "~$130/wk (after 30% abatement + tax)"
      difference: "~$85/wk — SLP makes part-time work viable"
  reddit_evidence:
    - source: "r/newzealand — 'SLP vs Jobseeker with medical certificate'"
      finding: "Multiple people reporting denial despite specialist letters"
    - source: "r/newzealand — 'JS-Medical studying'"
      finding: "Study hours counted as 'activity' against medical deferral on JS, not on SLP"
  tool_gaps:
    - id: js-vs-js-medical-not-distinguished
      current: "Tool surfaces JS as ENTITLED but can't recommend JS-Medical variant"
      needed: |
        When has_condition=true and work capacity is limited, flag that
        JS-Medical (with medical deferral) removes job search obligations.
        Without this, people face work test sanctions despite disability.
    - id: slp-borderline-not-flagged
      current: "SLP surfaces as POSSIBLE when work capacity is 15-30hrs"
      needed: |
        For people at the boundary (15-30hrs but with permanent condition),
        the tool should explain the SLP threshold and suggest requesting
        a formal work capacity assessment. Many people self-report higher
        capacity than they actually have.
  advocacy_points:
    - "Under s40, if medical evidence supports <15hr capacity, SLP must be granted — no discretion"
    - "Right to bring own medical evidence to counter designated doctor assessment"
    - "Request copy of designated doctor's report under OIA"
    - "Treating specialist opinion should carry more weight than a one-off MSD assessment"
    - "Appeal pathway: internal review → Benefits Review Committee → Social Security Appeal Authority"
    - "If on JS-Medical wanting to study: SLP is the better pathway (no work test = study doesn't conflict)"

# ═══════════════════════════════════════════════════════════════════════
# 3. DISABILITY ALLOWANCE — WHAT COUNTS AS AN ELIGIBLE COST
# ═══════════════════════════════════════════════════════════════════════

disability_allowance_costs:
  law: "s28A Social Security Act 2018 — ongoing additional costs arising from disability"
  grey_area: |
    DA covers "additional costs arising from the person's disability" up to
    $75.52/wk. But what counts as an "additional cost" is heavily discretionary.
    Case managers routinely reject legitimate costs, and beneficiaries don't
    know the full range of what's claimable.
  commonly_missed_costs:
    - category: "Transport"
      examples: ["Mileage to GP/specialist at 28c/km", "Taxi to appointments when unable to drive", "Bus fares to medical appointments"]
      grey: "MSD may challenge frequency of appointments or whether public transport was available"
    - category: "Prescriptions & medication"
      examples: ["Prescription co-pays", "Over-the-counter medications recommended by GP", "Supplements prescribed by specialist"]
      grey: "OTC items often rejected despite GP recommendation. Get a letter."
    - category: "Power & heating"
      examples: ["Extra power costs due to condition (being home all day, medical equipment, heating needs)"]
      grey: "Hard to prove 'extra' — MSD may compare to average household. Keep bills from before and after condition."
    - category: "Clothing & footwear"
      examples: ["Extra wear due to mobility aids", "Specialised footwear", "Continence supplies"]
      grey: "Often not mentioned by case managers. Must be raised by applicant."
    - category: "Gender-affirming care"
      examples: ["HRT prescriptions", "Endocrinologist visits", "Mental health support", "Blood tests for hormone monitoring"]
      grey: "Not proactively flagged by case managers. Trans beneficiaries frequently unaware these qualify."
    - category: "Diet"
      examples: ["Special dietary requirements due to condition (coeliac, diabetes, etc.)"]
      grey: "Requires GP letter confirming medical necessity. Amount often disputed."
    - category: "Communication"
      examples: ["Phone/internet for health management, telehealth appointments"]
      grey: "Telephone Allowance exists separately but is tiny. Excess costs can go on DA."
  msd_practice:
    - "Case managers do not proactively list all eligible cost categories"
    - "Beneficiaries must know to ask — there is no checklist provided"
    - "GP 'cost certificate' wording matters: 'ongoing costs arising from disability' is the magic phrase"
    - "Costs must be 'additional' — i.e., costs you wouldn't have without the disability"
    - "Receipts and documentation required, but a GP letter listing costs is often sufficient"
  tool_gaps:
    - id: da-cost-categories-not-surfaced
      current: "Tool asks about health cost types but doesn't map them to DA-eligible categories"
      needed: |
        When DA surfaces, show a checklist of eligible cost categories with
        examples. Prompt the user to consider costs they may not have thought of.
        This is pure information — telling people what they're legally entitled
        to claim.
  advocacy_points:
    - "Ask GP to write a letter listing ALL ongoing costs arising from disability"
    - "Include transport, power, diet, clothing — not just prescriptions and appointments"
    - "The $75.52/wk cap is per person — both partners in a couple can claim separately"
    - "If a cost is rejected, request written reasons and consider review under s12"
    - "Keep a 4-week cost diary before your appointment — real numbers are harder to dispute"

# ═══════════════════════════════════════════════════════════════════════
# 4. TEMPORARY ADDITIONAL SUPPORT — THE HARDSHIP CATCH-ALL
# ═══════════════════════════════════════════════════════════════════════

temporary_additional_support:
  law: "s80 Social Security Act 2018"
  grey_area: |
    TAS is the gap-filler: it covers the shortfall between income (including
    benefit) and essential costs. But "essential costs" is where discretion
    lives. Case managers decide what's essential, what amounts are reasonable,
    and whether costs are "avoidable." This is the benefit most often
    under-granted or not mentioned at all.
  msd_practice:
    - "Case managers often don't mention TAS exists — it must be asked for"
    - "Requires full financial breakdown of income and essential costs"
    - "'Essential' is narrowly interpreted: rent, power, basic food. Medical costs sometimes excluded."
    - "Reviewed every 13 weeks — can be reduced or cancelled at review"
    - "Amount is discretionary: same financial situation can produce different TAS amounts with different case managers"
    - "Must have explored all other avenues of support first (AS, DA, etc.)"
  tool_gaps:
    - id: tas-cost-breakdown-not-guided
      current: "Tool surfaces TAS as POSSIBLE/ENTITLED but gives no guidance on the cost breakdown"
      needed: |
        Walk the user through building their essential cost breakdown:
        rent, power, food, medical, transport, phone, insurance.
        This IS the TAS application. Having the numbers ready is the
        difference between getting $20/wk and $80/wk.
  advocacy_points:
    - "You have a legal right to apply for TAS — case managers cannot refuse to assess"
    - "Prepare a detailed weekly budget BEFORE the appointment"
    - "Include ALL essential costs, not just rent: power, food, medical, transport"
    - "If the amount seems low, ask how it was calculated and what costs were excluded"
    - "TAS is in addition to other supplements — it's not either/or"

# ═══════════════════════════════════════════════════════════════════════
# 5. SPECIAL NEEDS GRANTS — THE INVISIBLE ENTITLEMENT
# ═══════════════════════════════════════════════════════════════════════

special_needs_grants:
  law: "s65 Social Security Act 2018"
  grey_area: |
    SNGs are one-off payments for essential needs that can't be met from
    existing income. There is no statutory limit on frequency or total amount.
    But MSD applies unofficial internal limits and case managers routinely
    deny grants by claiming the need isn't "essential" or that the person
    should have budgeted for it.
  msd_practice:
    - "No proactive offering — must be specifically requested"
    - "Unofficial internal caps on frequency (e.g., 'you already had one this month')"
    - "Broad discretion on what's 'essential': food grants usually approved, clothing often denied"
    - "'Could you have budgeted for this?' is used to deny — but statute doesn't require perfect budgeting"
    - "Emergency food grants are almost never denied but case managers may try to redirect to food banks first"
    - "Whiteware (fridge, washing machine) grants available but rarely offered"
  tool_gaps:
    - id: sng-categories-not-listed
      current: "Tool surfaces SNG as ENTITLED/POSSIBLE but doesn't list what can be granted"
      needed: |
        Show categories: food, clothing, bedding, whiteware, medical costs,
        school costs, car repairs (if needed for employment). People don't
        know to ask for things like a fridge replacement.
  advocacy_points:
    - "There is no legal limit on how many SNGs you can receive"
    - "If denied, ask for the decision in writing with the specific legal basis"
    - "Food grants should not be replaced with a food bank referral — that's deflection"
    - "Whiteware grants exist: fridge, washing machine, beds, heaters"
    - "School-related costs (uniforms, stationery, camps) are eligible"

# ═══════════════════════════════════════════════════════════════════════
# 6. BENEFIT TRANSITIONS — WHAT YOU LOSE WHEN YOU SWITCH
# ═══════════════════════════════════════════════════════════════════════

benefit_transitions:
  grey_area: |
    Moving between benefits (JS → SLP, benefit → StudyLink, benefit → work)
    involves transitions where people routinely lose supplements they were
    entitled to keep, or fail to pick up new ones. MSD does not proactively
    manage these transitions. The gap between "old support ends" and "new
    support starts" can be weeks of zero income.
  common_traps:
    - transition: "JS-Medical → SLP"
      risk: "Supplements (AS, DA, TAS) may be cancelled and need to be re-applied for"
      reality: "Most supplements carry over but case managers may not action this"
    - transition: "Benefit → Student Allowance"
      risk: |
        Lose WINZ Accommodation Supplement (up to $305/wk) and get StudyLink
        Accommodation Benefit (max $60/wk) — a $245/wk drop in housing
        support. Also lose TAS, DA (must reapply through different system).
      reality: "This is the biggest hidden cost of studying for beneficiaries"
    - transition: "Benefit → Employment"
      risk: |
        Stand-down period before benefit cancels, but supplements stop
        immediately. If job falls through within 13 weeks, can reapply
        without stand-down — but many people don't know this.
      reality: "Fear of losing benefit prevents people from trying work"
    - transition: "Relationship declaration"
      risk: |
        Single rate → couple rate. All income testing recalculated.
        Partner's income assessed. Supplements may be reduced or cancelled.
        Can happen retroactively — MSD may demand repayment for the period
        they determine the relationship existed.
      reality: "People hide relationships to survive. MSD knows this and investigates."
  tool_gaps:
    - id: transition-modelling
      current: "Tool evaluates current snapshot only, no transition analysis"
      needed: |
        When someone is on benefit X and qualifies for benefit Y, show
        what they would gain AND lose in the transition. This is critical
        for JS→SLP and benefit→StudyLink transitions.

# ═══════════════════════════════════════════════════════════════════════
# 7. CASE MANAGER DISCRETION — THE HUMAN VARIABLE
# ═══════════════════════════════════════════════════════════════════════

case_manager_discretion:
  grey_area: |
    Many benefits involve case manager discretion: TAS amounts, SNG
    approval, training approval, hardship assessment. The same person with
    the same circumstances can get materially different outcomes depending
    on which case manager they see. This is by design — it gives MSD
    flexibility — but in practice it means outcomes are inconsistent
    and often depend on the beneficiary's ability to advocate.
  known_patterns:
    - "Newer case managers tend to follow policy more strictly (less discretion used)"
    - "Experienced case managers may know more options but also more ways to deny"
    - "Phone appointments produce worse outcomes than in-person (harder to advocate)"
    - "Monday mornings and Friday afternoons produce worse outcomes (anecdotal but consistent)"
    - "Having documentation ready shifts the dynamic from 'requesting' to 'confirming'"
    - "Mentioning specific section numbers of the SSA signals legal awareness"
  tool_contribution: |
    The tool's core value is equalising information asymmetry. A person who
    walks into a WINZ appointment knowing the specific section of the SSA 2018
    that supports their claim, with a printed list of what they're entitled to,
    with documentation ready — that person gets a materially different outcome
    than someone who says "I think I might be eligible for something?"

    The signed briefing document is the mechanism: it turns vague awareness
    into a specific, legally-grounded list of entitlements. The case manager
    knows that someone with a printed, signed document is more likely to
    appeal if denied. This changes the calculation.

# ═══════════════════════════════════════════════════════════════════════
# 8. ABATEMENT TRAPS — THE POVERTY CEILING
# ═══════════════════════════════════════════════════════════════════════

abatement_traps:
  law: "Schedule 4, Social Security Act 2018"
  grey_area: |
    Not discretionary per se — abatement rates are set by law. But the
    interaction between abatement, tax, and ACC levies creates effective
    marginal tax rates above 80% that beneficiaries rarely understand until
    they're caught. The "poverty trap" is structural, not discretionary,
    but the tool can surface it.
  key_rates:
    js_abatement: "70c per $1 above $160/wk threshold"
    slp_abatement: "30c per $1 above $160/wk threshold"
    effective_marginal_rate_js: "~82% (70% abatement + PAYE + ACC)"
    effective_marginal_rate_slp: "~48% (30% abatement + PAYE + ACC)"
  reddit_evidence:
    - "Multiple threads: 'it's not worth working' on JS due to 70c abatement"
    - "People unaware SLP has 30c rate — the benefit they don't know to ask for"
  tool_gaps:
    - id: abatement-calculator-not-implemented
      current: "Tool doesn't calculate take-home impact of earning while on benefit"
      needed: |
        Show the person: "If you earn $X/wk, your benefit reduces by $Y,
        you pay $Z tax, your net gain is $W." This makes the poverty trap
        visible and quantifiable. For JS→SLP candidates, showing the
        abatement difference is the most powerful argument for switching.

# ═══════════════════════════════════════════════════════════════════════
# 9. COMPLIANCE SANCTIONS — PUNISHMENT WITHOUT DUE PROCESS
# ═══════════════════════════════════════════════════════════════════════

compliance_sanctions:
  law: "s102-s117 Social Security Act 2018 — obligations and sanctions"
  grey_area: |
    MSD can reduce or suspend benefit for non-compliance with obligations
    (missing appointments, not meeting work test, etc.). The "traffic light"
    system (green → orange → red) escalates sanctions automatically. But
    the prerequisite — that MSD actually notified the person of the
    obligation — is often not verified before sanctions are applied.
    Beneficiaries are sanctioned first and must prove non-receipt, reversing
    the burden of proof.
  msd_practice:
    - "Notifications sent via MyMSD letters, email, or text — but delivery is unreliable"
    - "MyMSD shows letters before email/text notifications arrive"
    - "Sanctions applied automatically when appointment is marked as 'no show'"
    - "Case managers may refuse to investigate notification failure"
    - "Traffic light escalation: orange (5 days to respond) → red (benefit reduced)"
    - "Being at 'red' can reduce benefit by 50% or more"
    - "Complaining about a sanction can trigger further scrutiny and additional sanctions"
    - "Back-pay for wrongful sanctions often delayed — 'extra $20 on top of normal payment'"
    - "New case managers tend to be more rigid ('very straight forward')"
  financial_impact:
    normal_payment: "~$380/wk (JS + small AS)"
    after_first_sanction: "$55/wk (one example)"
    after_escalation: "$160/wk (same person, after complaint denied)"
    consequence: "Cannot afford rent or food. One notification failure → weeks of crisis."
  notification_obligation:
    law: "s102 SSA 2018 — MSD must notify beneficiaries of obligations"
    reality: |
      MSD's notification systems are unreliable. Emails don't arrive,
      texts aren't sent, letters are delayed. MyMSD portal shows letters
      but beneficiaries aren't always checking it proactively. When
      notification fails, MSD treats it as the beneficiary's problem.
    legal_position: |
      If MSD cannot produce evidence that notification was sent AND
      received (or at minimum, sent to the correct address/number),
      the sanction has no legal basis. The obligation to comply arises
      only after proper notification. This is basic procedural fairness.
  reddit_evidence:
    - source: "r/newzealand — 'Benefit got cut for not turning up for appointment'"
      upvotes: 180
      pattern: "Person never received notification. Case manager refused to investigate. Benefit cut from $380 to $55, then to $160 after complaint denied."
    - source: "Same thread — multiple similar stories"
      examples:
        - "Benefit cancelled for 'refusing work' — actually just ticked 'day shift' preference on application"
        - "Call centre agreed to cancel appointment, didn't actually cancel it, benefit cut"
        - "90-day'd from job on day 89, took 3 weeks to reinstate benefit"
  taking_advantage_analysis: |
    The Reddit thread shows zero evidence of system abuse. The person:
    - Is actively seeking work and genuinely wants a job
    - Lives frugally ("don't waste money on stupid stuff")
    - Proactively contacted MSD when payment was wrong
    - Filed a complaint through proper channels
    - Was punished for a notification failure they had no control over

    This is the OPPOSITE of taking advantage. The system is taking
    advantage of the person's vulnerability and lack of knowledge about
    appeal rights. The person didn't know they could file a Review of
    Decision, request the notification evidence, contact their MP, or
    get a free advocate. Strangers on Reddit provided better support
    than the case manager.
  tool_gaps:
    - id: sanctions-not-modelled
      current: "Tool has no concept of sanctions, compliance obligations, or appeal rights"
      needed: |
        When on_benefit=true, surface a "know your rights" section:
        - MSD must notify you of all appointments and obligations
        - If benefit is reduced, you can file a Review of Decision (s12 SSA 2018)
        - Request evidence that notification was sent (OIA)
        - File a complaint via MSD website (faster than ROD)
        - Contact MP's office for ministerial inquiry
        - Free advocates available through CAB and Community Law
    - id: emergency-grants-not-prominent
      current: "SNG surfaces as one of many entitlements"
      needed: |
        When in_emergency=true and on_benefit=true, SNG for food should
        be surfaced as IMMEDIATE — top of list, distinct from regular
        entitlements. This is the difference between eating and not eating.
    - id: rent-arrears-pathway
      current: "RAP surfaces but no guidance on arrears"
      needed: |
        When has_rent_arrears=true, show specific pathway: get landlord
        letter → apply for RAP for arrears → this prevents eviction.
  advocacy_points:
    - "Request a copy of the notification MSD claims they sent — they must provide this under the OIA"
    - "File an online complaint at MSD website — triggers call from manager, faster than ROD"
    - "File a Review of Decision under s12 SSA 2018 — formal review that must address the notification failure"
    - "Contact your MP's office — ministerial inquiry goes directly to branch manager"
    - "Get a free WINZ advocate from Citizens Advice Bureau or Community Law"
    - "Apply for a Special Needs Grant for food IMMEDIATELY — this is almost never denied"
    - "If rent is behind, get landlord letter and apply for rent arrears through RAP"
    - "The case manager's obligation to notify is not optional — it is a statutory requirement under s102"

# ═══════════════════════════════════════════════════════════════════════
# TOOL ROADMAP: GREY AREA CAPABILITIES
# ═══════════════════════════════════════════════════════════════════════
#
# Phase 1 (current): Binary rule evaluation — "you likely qualify for X"
#   ✓ Implemented. 73 benefits, rules-based, data-driven.
#
# Phase 2 (next): Risk and transition warnings
#   - Relationship declaration risk warnings
#   - Partner income impact modelling
#   - Benefit transition gain/loss analysis
#   - JS vs JS-Medical vs SLP pathway guidance
#
# Phase 3 (target): Advocacy support
#   - Specific SSA section citations for each grey area
#   - Checklist of eligible DA cost categories
#   - TAS essential cost breakdown builder
#   - Abatement calculator showing take-home impact
#   - "What to say at your appointment" for each entitlement
#   - Case manager discretion patterns and counter-strategies
#
# Phase 4 (aspiration): Pattern detection
#   - Aggregate outcome data reveals which grey areas produce the most
#     denials by region, benefit type, and case manager patterns
#   - Feed this back into the tool: "In your region, X% of DA claims for
#     transport costs are initially denied but Y% succeed on review"
#   - OIA ammunition: anonymised denial patterns for advocacy groups
`,r=`# Test Scenario: Reddit "Benefit got cut for a week due to not turning up for appointment"
# Source: reddit.com/r/newzealand — 180 upvotes, 82 comments
#
# This person is NOT taking advantage of the system. Assessment:
#
# TAKING ADVANTAGE? NO.
# - Actively seeking work, has been looking "for so long"
# - Doesn't "do anything bad or waste money on stupid stuff"
# - Genuinely wants a job
# - Missed appointment because MSD failed to notify — no text, email, or letter
# - Sanction left them unable to pay rent or buy food for a week
# - Case manager refused back-pay without investigating the notification failure
# - Follow-up post: benefit FURTHER reduced ($160 instead of $380) after complaint denied
#
# This is the opposite of taking advantage. This is a person doing everything
# right being punished by a system failure, then punished again when they try
# to fix it. The "traffic light" compliance system (orange → red) can cascade:
# one missed notification → sanction → complaint → denied → further reduction.
#
# What this scenario reveals:
#
# 1. SANCTIONS GREY AREA:
#    MSD has an obligation to notify beneficiaries of appointments (s102 SSA 2018).
#    If notification fails, the sanction should not apply. But case managers apply
#    sanctions first and let the beneficiary prove non-receipt — reversing the
#    burden of proof. The "very straight forward" case manager refused to
#    investigate whether notification was actually sent/received.
#
# 2. IMMEDIATE CRISIS RESPONSE:
#    When benefit is cut, the person can't eat or pay rent. The tool should
#    surface emergency options: food grants (SNG), rent arrears assistance.
#    These exist but the person didn't know to ask.
#
# 3. APPEAL RIGHTS:
#    Reddit commenters know the system better than the beneficiary:
#    - Review of Decision (ROD) — formal s12 SSA 2018 review
#    - Complaint to MSD (faster, less formal)
#    - Contact MP's office (bypasses local office)
#    - Request copy of the notification MSD claims they sent
#    - WINZ advocate through Citizens Advice Bureau or Community Law
#    The person knew none of these options.
#
# 4. MISSING SUPPLEMENTS:
#    Person receives ~$380/wk which suggests base JS only. No mention of
#    any supplements. On JS and seeking work for a long time — likely
#    qualifies for employment support, hardship grants, possibly AS.
#
# Reddit thread key quotes:
# - "Review of decision, part of their obligation to you is to inform you
#    of your obligations" (156 upvotes)
# - "The order from the top (government) is to save as much money as possible
#    by fucking over vulnerable people" (123 upvotes)
# - "With people living week to week on the benefit, the last thing you need
#    is a case manager who doesn't care" (72 upvotes)
# - "I have reason to believe they do this on purpose"
# - Follow-up from OP: "They reviewed my complaint and denied it, I usually
#    receive $380, I received $160, what the fuck is going on?"

scenario:
  name: "Benefit sanction for missed appointment — notification failure"
  description: >
    Young person on Jobseeker Support, actively seeking work for extended period.
    Benefit cut from ~$380/wk to $55 for missing an appointment they were never
    notified about. New case manager refused back-pay. Subsequent complaint denied
    and benefit further reduced to $160. Cannot afford rent or food. This is a
    compliance sanctions scenario — the person did nothing wrong but the system
    punished them anyway. Tests whether the tool surfaces emergency grants,
    appeal rights, and missing supplements.

intake_answers:
  # PERSONAL
  personal.age: 23
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 23
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 250
  housing.region: "Other"
  housing.social_housing: "No"
  housing.arrears: "Yes"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.unemployment_duration: "More than 12 months"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "Yes"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: jobseeker-support
      status: ENTITLED
      reasoning: >
        18+, NZ citizen, resident 2+ years, actively seeking work.
        Already on JS — tool confirms entitlement. The sanction reducing
        payment is a compliance issue, not an eligibility issue.

    - id: special-needs-grant
      status: ENTITLED
      reasoning: >
        On benefit, low income, essential need (emergency — can't buy food).
        This is the IMMEDIATE response the person needs. A food grant is
        almost never denied. The person didn't know to ask for one.
        Reddit commenters mentioned food grants but the person clearly
        didn't know this was an option.

    - id: recoverable-assistance-programme
      status: ENTITLED
      reasoning: >
        On benefit, low income, essential need. RAP can cover rent arrears
        (recoverable — repaid from future benefit). The person said they
        couldn't give rent this week. A landlord arrears letter enables this.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting, not in social housing. Person receives ~$380/wk which is
        close to base JS rate ($337.74) — suggests they may already have
        a small AS, or may be missing it entirely. Either way, should be
        confirmed at full amount for their zone.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic. Low income, no employment income.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. Automatic May-October.

    - id: flexi-wage
      status: ENTITLED
      reasoning: >
        Seeking work, barriers to employment (12+ months unemployed).
        Flexi-wage subsidises employers to hire long-term unemployed.
        Person says they genuinely want a job — this removes a barrier.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children"
    - id: supported-living-payment
      reasoning: "No health condition reported"
    - id: disability-allowance
      reasoning: "No health condition reported"
    - id: student-allowance
      reasoning: "Not a student"

crisis_expected:
  is_crisis: true
  crisis_tab: true
  reinstatement_steps: true   # on benefit — shows s12, s102, s391 guidance
  arrears_warning: true       # housing.arrears is "Yes" — shows RAP guidance

# Is this person taking advantage of the system?
taking_advantage_assessment:
  verdict: "NO — categorically not"
  evidence_of_compliance:
    - "Actively seeking work for an extended period"
    - "Doesn't waste money — lives frugally by their own account"
    - "Genuinely wants employment"
    - "Was willing to attend the appointment — simply never received notification"
    - "Proactively contacted case manager when payment was wrong"
    - "Filed a complaint through proper channels"
  evidence_of_system_failure:
    - "MSD failed to send notification (no text, email, or letter received)"
    - "New case manager refused to investigate notification failure"
    - "Sanction applied without verifying notification was received"
    - "Complaint denied without addressing the notification issue"
    - "Benefit further reduced after complaint ($380 → $160) — punished for complaining?"
    - "Person left unable to afford food or rent — the safety net failed"
  pattern: >
    This is a common MSD pattern documented across Reddit: notifications
    fail silently (MyMSD letters appear before email/text), sanctions are
    applied automatically, and the burden falls on the beneficiary to prove
    non-receipt. The "traffic light" compliance system (green → orange → red)
    can cascade: one missed notification → sanction → reduced payment →
    can't afford essentials → emergency. The person is trapped by a system
    designed to penalise non-compliance but which doesn't reliably notify
    people of what they need to comply with.

# What the tool should eventually surface for this situation
sanctions_response:
  immediate:
    - "Apply for a Special Needs Grant for food — this is almost never denied"
    - "If rent is behind, get a letter from landlord showing arrears and apply for rent arrears assistance"
    - "You can also get a food parcel from Salvation Army without the degrading WINZ process"
  appeal:
    - action: "Request copy of the notification MSD claims they sent"
      legal_basis: "Official Information Act 1982 — they must provide this"
      why: "If they can't produce evidence of notification, the sanction has no basis"
    - action: "File a formal complaint via MSD website"
      legal_basis: "MSD complaints process"
      why: "Online complaint triggers call from manager — faster than ROD"
    - action: "File a Review of Decision (ROD)"
      legal_basis: "s12 Social Security Act 2018"
      why: "Formal review. MSD obligation to notify is part of their duty — if they failed, sanction must be reversed"
    - action: "Contact your MP's office"
      legal_basis: "Ministerial inquiry process"
      why: "MP contacts branch manager directly. Reddit reports this produces fastest results"
    - action: "Get a WINZ advocate from Citizens Advice Bureau or Community Law"
      legal_basis: "Right to representation"
      why: "Advocates know the system and case managers are less likely to dismiss claims with an advocate present"
  key_legal_point: >
    Under s102 Social Security Act 2018, MSD must notify beneficiaries of
    their obligations. A sanction for non-compliance with an obligation the
    person was never notified of is procedurally unfair and should be reversed
    on review. The case manager's refusal to investigate the notification
    failure is itself a failure of process.

notes:
  - >
    The $380/wk figure suggests base JS ($337.74) plus possibly a small
    Accommodation Supplement. If the person is paying $250/wk rent on
    $380/wk total income, they're spending 66% of income on rent alone.
    TAS should be assessed. The "little else to spare" comment confirms
    this person is in genuine hardship, not gaming the system.
  - >
    The follow-up is alarming: after filing a complaint, benefit was
    reduced further ($380 → $160). This suggests the "traffic light"
    system escalated them to red (further sanctions) rather than
    investigating the original notification failure. Being punished
    for exercising your right to complain is a serious procedural concern.
  - >
    Reddit's top advice (156 upvotes): "Review of decision — part of their
    obligation to you is to inform you of your obligations, which, if
    they'd done, you would have known about their appointment, so they
    owe you your backpay." This is legally correct but the person didn't
    know this until strangers on Reddit told them.
  - >
    This scenario is a perfect example of why the tool matters: the gap
    isn't eligibility knowledge — the person knows they're on JS. The gap
    is crisis response (food grants exist), appeal rights (ROD exists),
    and advocacy (free advocates exist). The tool's briefing document
    should include a "if your benefit is reduced" section with these steps.
  - >
    Multiple commenters share similar stories: benefits cut for missing
    appointments they weren't notified about, benefits cut for "refusing
    work" when they simply expressed a shift preference, benefits cancelled
    after being 90-day'd from a job. The compliance system is punitive
    by design, and the notification infrastructure is unreliable.
`,l=`# Test Scenario: Married couple — husband works, wife not working, 2 kids under 3
# Based on Reddit post: wife breastfeeding, husband earns $693/wk (30hrs), 2 kids
#
# Key assertions:
# - SPS must NOT surface (has partner — not a sole parent)
# - JS may surface as POSSIBLE (couple_income_high reduces confidence)
# - WFF should surface (family with children)
# - Accommodation Supplement should surface

scenario:
  name: "Couple — husband working, wife not working, 2 kids under 3"
  description: >
    Married couple. Husband works 30hrs at $23.10/hr ($693/wk). Wife not
    currently working (breastfeeding). Two children under 3. Renting in
    Wellington at $550/wk. Not currently on any benefit. The tool should NOT
    surface Sole Parent Support (she has a partner). Jobseeker Support may
    surface but with reduced confidence due to high partner income.

intake_answers:
  # TRIAGE
  triage.reason: "Full assessment of everything I might be entitled to"

  # PERSONAL
  personal.age: 28
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 28
  personal.relationship: "Married / civil union"
  personal.partner_income: 693

  # HOUSING
  housing.type: "Renting"
  housing.cost: 550
  housing.region: "Wellington"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "No"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "No"

  # CHILDREN
  children.dependent: "Yes"
  children.count: 2
  children.ages:
    - "Under 1 year"
    - "1 – 2 years"
  children.childcare: "No"
  children.disability: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: working-for-families-tax-credit
      reasoning: "Family with children, income qualifies"
    - id: accommodation-supplement
      reasoning: "Renting in Wellington, low personal income"

  should_not_surface:
    - id: sole-parent-support
      reasoning: "Has partner — not a sole parent. Critical rule must exclude."

notes:
  - >
    This scenario tests the critical rule flag on SPS. Previously, SPS had 6 rules
    and is_sole_parent failing gave 83% pass ratio = POSSIBLE. With critical: true,
    having a partner now excludes SPS entirely.
  - >
    Partner earns $693/wk — well above $250/wk threshold. couple_income_high = true
    means the couple_income_high neq true rule on JS fails, reducing confidence.
    JS may still surface as POSSIBLE but with lower confidence reflecting the
    significant partner income that would trigger heavy abatement.
  - >
    Transition scenarios now include childcare cost deduction for 2 kids under 3
    (~$600/wk at $300/wk each). This makes the true cost of working visible — a
    stay-at-home parent going to work must pay for childcare, which dramatically
    changes the economics of the transition.
`,c=`# Test Scenario: Reddit "Declined Disability Allowance for power/heating"
# Source: reddit.com/r/newzealand
#
# This person represents a common DA deflection pattern:
# 1. On Supported Living Payment (has serious disability)
# 2. Applied for DA specifically for power/gas/heating costs
# 3. Declined because case manager "felt" they don't need it
# 4. Not notified of decline — found out a month later when they called
# 5. Told they can apply for Review of Decision (ROD)
#
# Reddit thread reveals critical information:
# - DA covers costs "directly related to disability" — prescriptions,
#   GP visits, unfunded medication, medical devices, therapies, AND
#   a portion of power if doctor certifies the need
# - Power costs CAN be covered if tied to medical devices (dehumidifier,
#   CPAP, clothes dryer for physical disability, heat pump for condition)
# - Must prove EXTRA cost above normal usage, not total cost
# - GP must specifically write that the appliance use is medically required
# - Chiro/acupuncture can be covered if GP writes supporting letter
# - Non-funded medication: need GP letter explaining why funded alternatives
#   don't work (medical reason, not just religious preference)
# - TAS is an alternative pathway for power costs that don't qualify under DA
# - s12 SSA 2018 requires written reasons for any decision
# - Notification failure is itself grounds for complaint
#
# This scenario tests:
# - DA surfaces despite being declined (the decline was wrong)
# - Power/heating supplement surfaces separately
# - TAS surfaces as fallback for costs DA doesn't cover
# - Health-related costs pathway activates
# - The tool helps the person prepare for ROD with evidence
#
# Assumptions:
# - On SLP = serious disability, likely permanent
# - Has ongoing disability costs (power, heating, medical)
# - Single (tone of post), mid-30s
# - Renting (common for SLP recipients)
# - Not working (on SLP, no mention of employment)
# - Has health-related costs including power/heating, GP, prescriptions
# - Uses medical devices requiring extra power (dehumidifier, dryer)

scenario:
  name: "DA declined for power/heating — SLP recipient, notification failure"
  description: >
    Adult on Supported Living Payment with serious disability. Applied for
    Disability Allowance for power/gas/heating costs. Declined without
    notification — discovered a month later by phone. Case manager said
    they "felt" the person doesn't need it because they get SLP. Has
    medical devices requiring extra power (dehumidifier, dryer, heat pump).
    Also has ongoing GP, prescription, and alternative therapy costs.
    Needs to understand ROD process and what DA actually covers.

intake_answers:
  # PERSONAL
  personal.age: 34
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 34
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 280
  housing.region: "Auckland"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME — on SLP, no employment income
  income.employed: "No"
  income.benefit: "Yes"
  income.benefit_type: "Supported Living Payment"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH — serious disability, permanent, multiple cost types
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Extra power / heating"
    - "Transport to appointments"
    - "Equipment or aids"
  health.hours_able: "Unable to work"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY — DA was declined
  history.past_denied: "Yes"
  history.denied_what: "Disability Allowance"
  history.written: "No — verbal only"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: disability-allowance
      status: ENTITLED
      reasoning: >
        Core finding. Person has a permanent disability with ongoing costs
        (GP, prescriptions, power, transport, equipment). DA eligibility
        is under s85 SSA 2018; SLP is under s40. These are in separate
        subparts of the Act and no provision excludes SLP recipients from
        DA. MSD's own guidance says "You don't have to be on a benefit to
        qualify." CAVEAT: This is based on statutory text — no specific
        SSAA or court decision has directly ruled on SLP+DA concurrency.
        The statutory interpretation is strong but formally untested.
        Decline should be challenged via ROD (s391). Key evidence: GP
        letter itemising each cost category, power bills showing extra
        usage from medical devices, receipts for prescriptions and transport.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting in Auckland, on SLP, not in social housing.
        Single with no employment income — well under thresholds.
        Not currently receiving any supplements per intake.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On SLP (main benefit). WEP is automatic May-October.
        $20.46/wk single. Particularly relevant given their
        extra power costs from medical devices.

    - id: temporary-additional-support
      status: ENTITLED
      reasoning: >
        On SLP with no employment income, paying $280/wk rent.
        SLP is $371.52/wk gross. Essential costs likely exceed
        income. TAS is the fallback for costs DA doesn't cover,
        as several Reddit commenters noted.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On main benefit — automatic. Reduces GP visits to $19.50
        and prescriptions to $5. Critical given ongoing health costs.

    - id: health-related-costs
      status: ENTITLED
      reasoning: >
        Has health condition with ongoing health-related costs.
        Low income on SLP. This pathway covers costs that may
        not fit neatly into DA categories.

    - id: power-and-heating-supplement
      status: ENTITLED
      reasoning: >
        Has condition requiring extra power/heating. The specific
        benefit they were trying to access through DA. This should
        surface as its own entitlement pathway.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, not a sole parent"
    - id: childcare-assistance
      reasoning: "No children"
    # NOTE: jobseeker-support surfaces as POSSIBLE (73%) because the engine
    # has no benefit hierarchy model — it doesn't know SLP > JS. This is a
    # known gap. In the UI, it falls into the contingency section (below 65%
    # threshold... actually 73% is above). TODO: add benefit hierarchy rules
    # so lower-tier benefits don't surface when already on a higher tier.

crisis_expected:
  is_crisis: false
  crisis_tab: false

notes:
  - >
    STATUTE: SLP is under s40 SSA 2018 (Subpart 4 — main benefits). DA
    is under s85-87 (Subpart 9 — supplementary assistance). No provision
    in the Act excludes SLP recipients from DA. The only explicit DA
    exclusion is for Residential Care Subsidy recipients (s144).
    INTERPRETATION: The case manager's reasoning ("you get SLP so you
    don't need DA") has no statutory basis. SLP compensates for lost
    earning capacity; DA covers ongoing disability costs. However, we
    have not found a published SSAA or court decision directly ruling
    on SLP+DA concurrency. The statutory text is clear but formally
    untested on this specific point. MSD's own website confirms DA is
    available regardless of benefit status.
  - >
    The notification failure is a separate issue. Under s12 SSA 2018,
    MSD must give written reasons for decisions. Not being told about
    the decline for a month, and only finding out by calling, is a
    procedural failure that strengthens the ROD case.
  - >
    Reddit advice on power costs is accurate: must prove EXTRA cost
    above normal usage. Method: measure power for a week without
    medical devices, then with. The differential is the claimable amount.
    GP must certify the devices are medically necessary.
  - >
    The "religious reasons" sub-thread is a red herring for this scenario
    but illustrates another deflection pattern. The correct approach:
    get GP to write that the funded medication is medically contraindicated
    (not just religiously objectionable). Medical contraindication is
    much harder for WINZ to argue against.
  - >
    Multiple Reddit commenters suggest TAS as an alternative to DA for
    power costs. This is correct — if DA doesn't cover the full extra
    power cost, TAS can pick up the remainder as an "essential cost."
  - >
    The tool's value here: surface ALL the entitlements this person is
    missing (AS, WEP, TAS, CSC, health costs) while also confirming
    that DA should be pursued via ROD. The person came asking about
    one declined benefit but is likely missing 5-6 others.
`,d=`# Test Scenario: Reddit "WINZ Benefit Advice" post
# Source: reddit.com/r/newzealand — user on Jobseeker with medical cert, earning $25/hr x 20hrs
#
# This person is a classic case of someone who:
# 1. Knows about their main benefit but not about supplementary entitlements
# 2. Is confused about income abatement and tax interactions
# 3. May be missing Accommodation Supplement, Disability Allowance, TAS, and WEP
# 4. Doesn't realise they can get a Community Services Card
#
# The Reddit thread reveals the real friction: multiple commenters say
# "it's not worth working" due to the 70c/$1 abatement + tax. The system
# design actively discourages part-time work for people with health conditions.

scenario:
  name: "Jobseeker with medical cert — part-time worker"
  description: >
    Adult 25+ on Jobseeker Support with a medical certificate, working 20 hrs/wk
    at $25/hr. Renting in a mid-cost area. Has a health condition causing ongoing
    costs. Single, no children. Not receiving any supplements beyond the base benefit.
    This is a gap scenario — they're almost certainly missing several entitlements.

intake_answers:
  # PERSONAL
  personal.age: 30
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 30
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 280
  housing.region: "Canterbury / Christchurch"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "Yes"
  income.hours: 20
  income.amount: 500
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "More than 2 years"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Transport to appointments"
  health.hours_able: "15 – 30 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting at $280/wk in Canterbury (Zone 2), single no children.
        Max AS for this profile is ~$105/wk. Income is $500/wk from work
        plus abated benefit — well within the threshold for AS.
        This person is almost certainly not receiving this.

    - id: disability-allowance
      status: POSSIBLE
      reasoning: >
        Has a health condition >2 years with ongoing GP, prescription, and
        transport costs. Meets all criteria for DA assessment. Max $75.52/wk.
        This is the most commonly missed supplement for people on JS-Medical.
        Requires GP letter itemising costs.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. WEP is automatic May-October. $20.46/wk single.
        Should already be receiving this — but the Reddit post mentions
        ~$360 after tax, which is close to base JS-25+ ($337.74 gross ~$290 net)
        plus AS. WEP may or may not be included. Worth confirming.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        Housing cost ratio: $280/$500 = 56% of income on rent.
        Has health costs on top. TAS is designed exactly for this scenario.
        Requires detailed essential cost breakdown at appointment.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — should be automatic. Gives discounted GP visits
        and prescriptions. If they're paying full price for GP visits mentioned
        in health costs, this card would reduce those costs.

    - id: supported-living-payment
      status: POSSIBLE
      reasoning: >
        Has a health condition >2 years and meets age/residency criteria.
        Work capacity is 15-30 hrs (above the <15hr threshold for SLP),
        so the key SLP rule fails. But it's still worth raising at an
        appointment — if the condition worsens, SLP becomes the correct
        benefit. Surfaces as POSSIBLE because 4/5 rules pass.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children"
    - id: childcare-assistance
      reasoning: "No children"

# Real-world income calculation (from the Reddit thread)
# This is what the tool should eventually help people understand:
income_analysis:
  gross_weekly_employment: 500      # $25 x 20hrs
  js_base_gross: 337.74             # JS 25+ single rate
  abatement_free: 160               # First $160 earned = no abatement
  abatement_amount: 238             # ($500 - $160) x $0.70 = $238
  js_after_abatement: 99.74         # $337.74 - $238 = $99.74
  combined_gross: 599.74            # $500 + $99.74
  # Tax on $500 employment income:
  employment_paye: 87.50            # 17.5% rate
  employment_acc: 8.00              # ~1.6%
  employment_kiwisaver: 15.00       # 3%
  employment_net: 389.50
  # Net JS after tax:
  js_net: 84.79                     # $99.74 x ~0.85 (M tax code)
  total_weekly_net: 474.29          # $389.50 + $84.79
  # Compare to not working:
  js_only_net: 290.00               # ~$337.74 after PAYE at M rate
  net_gain_from_working: 184.29     # $474.29 - $290.00
  effective_hourly_rate: 9.21       # $184.29 / 20hrs = $9.21/hr effective
  # Key insight from Reddit thread:
  # "After $160, you keep about 5% of what you earn" — this is roughly correct
  # when you factor 70% abatement + ~17.5% tax on the remaining 30%
  # Effective marginal rate above $160: ~82%

notes:
  - >
    The Reddit commenters correctly identify the poverty trap: above $160/wk
    earned, the effective marginal rate is ~82% (70% abatement + tax on remainder).
    The person effectively earns $9.21/hr for their 20 hours of work.
  - >
    What the Reddit thread DOESN'T mention: this person is likely missing
    Accommodation Supplement ($80-$105/wk), Disability Allowance (up to $75.52/wk),
    and possibly TAS. These could add $155-$277/wk to their income.
  - >
    The gap between "what the law says" and "what people actually receive" is
    exactly what this tool is designed to surface. The Reddit poster knows about
    their base benefit and abatement rules, but not about supplementary entitlements.
  - >
    Community Services Card would reduce the GP visit costs they're paying,
    which in turn affects Disability Allowance calculation (lower costs = lower DA,
    but net position is still better).
`,h=`# Test Scenario: Reddit "WINZ Advice — JS Medical, casual to permanent role"
# Source: reddit.com/r/newzealand
#
# This person represents a common transition anxiety:
# 1. On Jobseeker Support with medical certificate for 5 years
# 2. Working casual, option to go permanent 25hrs @ $25.30/hr
# 3. Worried about losing benefit safety net on sick days
# 4. Wants to know if DA and Accommodation Supplement survive the transition
# 5. Worried about what happens if they work over 25 hours
#
# Reddit thread reveals:
# - 25 x $25.30 = $632.50/wk gross — well under AS/DA income thresholds
# - Can stay on benefit at reduced rate (~$30/wk after abatement)
# - S tax code applies to employment earnings while on benefit
# - AS and DA both survive at this income level
# - TAS may also apply depending on costs
# - The real risk: JS-Medical abatement is 70c/$1 above $160 threshold
#   making the effective marginal tax rate ~82%
# - If SLP were granted instead, abatement would be 30c/$1 — much better
#
# Key insight from comments: "you don't have to decide to cancel your
# benefit immediately so you'll still have that option available"
#
# Assumptions for scenario:
# - Single, no children (not stated but implied by tone)
# - Age ~30s (on JS-Medical 5 years, working age)
# - Has a health condition (medical certificate for 5 years = long-term)
# - Currently working casual (some hours, variable income)
# - Renting (asking about Accommodation Supplement)
# - Already receiving DA (asking if they'd keep it)
# - Auckland region (conservative assumption for AS zone)

scenario:
  name: "JS-Medical recipient — casual to permanent 25hr role"
  description: >
    Adult on Jobseeker Support with medical certificate for 5 years.
    Currently working casual, considering permanent 25hr/wk position
    at $25.30/hr ($632.50/wk gross). Has a long-term health condition.
    Renting in Auckland. Worried about losing benefit safety net and
    whether DA and Accommodation Supplement survive the income increase.

intake_answers:
  # PERSONAL
  personal.age: 33
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 33
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 300
  housing.region: "Auckland"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME — currently working casual, ~15hrs at variable rate
  # Using the potential permanent role income for forward-looking assessment
  income.employed: "Yes"
  income.hours: 25
  income.amount: 632
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "Disability Allowance"
    - "Accommodation Supplement"
  income.assets: "Under $8,100"

  # HEALTH — on medical cert for 5 years = long-term condition
  health.condition: "Yes"
  health.duration: "More than 2 years"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
  health.hours_able: "Less than 15 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: supported-living-payment
      status: ENTITLED
      reasoning: >
        On JS-Medical for 5 years with condition limiting work to <15hrs.
        Meets all SLP criteria under s40 SSA 2018. SLP would be transformative:
        30c/$1 abatement vs 70c/$1 on JS. At $632.50/wk earnings above $160
        threshold, JS abates by $330.75 (70% of $472.50) while SLP would
        abate by only $141.75 (30% of $472.50). That's ~$189/wk difference
        in take-home. This is THE key finding.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Already receiving. At $632.50/wk income, still well under the
        income threshold where AS cuts out entirely. Will continue to
        receive AS though amount may reduce with income testing.

    - id: disability-allowance
      status: ENTITLED
      reasoning: >
        Already receiving. DA income thresholds are generous.
        $632.50/wk is below the single person DA income limit.
        Will continue receiving DA regardless of employment change.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. WEP is automatic May-October.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        On benefit with employment income. If essential costs exceed
        income after benefit abatement, TAS may help bridge the gap.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement. Critical for
        reducing GP and prescription costs given ongoing health condition.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, not a sole parent"
    - id: childcare-assistance
      reasoning: "No children"
    - id: student-allowance
      reasoning: "Not studying"

notes:
  - >
    The Reddit thread's most valuable advice: "you don't have to decide
    to cancel your benefit immediately." The person can trial the permanent
    role while staying on benefit at a reduced rate. If health prevents
    sustained employment, the safety net remains.
  - >
    The tool should surface SLP as the critical finding. At 25hrs/$25.30,
    the JS-Medical 70c/$1 abatement is devastating. SLP's 30c/$1 would
    make this employment financially worthwhile. The person has been on
    JS-Medical for 5 YEARS with a condition limiting work capacity —
    they almost certainly qualify for SLP but likely were never told.
  - >
    One commenter notes AS and DA "DO have income limits" — technically
    true but misleading at this income level. The tool should reassure
    that both continue at $632.50/wk gross income.
  - >
    The abatement trap is the hidden story: at $632.50/wk on JS-Medical,
    gross benefit reduces to ~$30/wk. The person keeps almost nothing
    of the benefit. On SLP at the same income, they'd keep ~$230/wk of
    benefit. The ~$200/wk difference is life-changing.
`,u=`# Test Scenario: Reddit "On JS-Medical, want to study Masters full-time"
# Source: reddit.com/r/newzealand — discussion about studying while on benefit
#
# This person represents a gap the tool couldn't previously address:
# 1. Has a permanent condition limiting work capacity to <15 hrs/wk
# 2. Currently on Jobseeker Support with medical certificate (JS-Medical)
# 3. Wants to study a Masters degree full-time
# 4. Key interactions:
#    - Student Allowance NOT available for Masters — person must stay on benefit or take loan
#    - SLP allows full-time study while keeping benefit (better path for disabled students)
#    - JS-Medical treats study hours = work capacity hours — >15hrs study may lose deferral
#    - Training Incentive Allowance available for study costs if on benefit
#    - Student Loan Living Costs available as supplementary income (but it's a loan)

scenario:
  name: "JS-Medical recipient wanting to study Masters full-time"
  description: >
    35yo NZ citizen with permanent condition, work capacity <15 hrs/wk,
    currently on Jobseeker Support with medical cert. Wants to study Masters
    full-time (4 papers). Single, renting in Wellington, low assets.
    The tool should surface SLP as the better pathway (can study while on SLP),
    flag that Student Allowance is NOT available for Masters, and show
    Student Loan Living Costs as an option.

intake_answers:
  # PERSONAL
  personal.age: 35
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 35
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 300
  housing.region: "Wellington"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
  health.hours_able: "Less than 15 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "Yes"
  education.level: "Masters"
  education.load: "Full-time"
  education.papers: 4

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "Yes"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: supported-living-payment
      status: ENTITLED
      reasoning: >
        Permanent condition, <15hr work capacity, 18+, NZ citizen. Meets SLP
        criteria. Critical: SLP allows full-time study without losing benefit.
        On JS-Medical, full-time study (40hrs/wk equivalent) may conflict with
        the medical deferral that limits "work capacity" to <15hrs.

    - id: training-incentive-allowance
      status: ENTITLED
      reasoning: >
        On a main benefit and interested in training/education. TIA covers
        study costs up to ~$1200/year. Must be on benefit to receive this.

    - id: student-loan-living-costs
      status: POSSIBLE
      reasoning: >
        Is a student studying full-time. Student Loan Living Costs available
        for all levels including Masters. However, cannot receive alongside
        a main benefit — would need to leave benefit first. Surfaced as
        POSSIBLE because currently on benefit.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting $300/wk in Wellington (Zone 1), single, on benefit.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement.

  should_not_surface:
    - id: student-allowance
      reasoning: >
        Masters level study — Student Allowance is NOT available for
        postgraduate study above Honours level. This is the key exclusion.

    - id: accommodation-benefit-students
      reasoning: >
        Linked to Student Allowance eligibility. Since Student Allowance
        is excluded for Masters, this is also excluded.

notes:
  - >
    The critical insight: SLP is the better pathway for disabled students.
    On SLP there are no work test obligations, so full-time study doesn't
    conflict. On JS-Medical, WINZ treats study hours as "activity" that
    may be counted against the medical deferral.
  - >
    Student Allowance gap: Not available for Masters or PhD. This forces
    postgrad students with disabilities to either stay on WINZ benefit
    (losing Student Allowance housing support) or take on loan debt.
  - >
    Training Incentive Allowance is the bridge — it helps with study costs
    while staying on benefit, but maxes at ~$1200/year which won't cover
    full Masters fees.
`,p=`# Test Scenario: Reddit "How will I be taxed working on Jobseeker"
# Source: reddit.com/r/newzealand — person on JS-Medical (<15hr obligations),
# planning to work 13 hrs/wk on minimum wage, confused about tax codes
#
# Key Reddit insights:
# 1. Person has <15hr medical obligations — this IS the SLP threshold
# 2. Benefit uses M tax code; employment income gets secondary tax code (S)
# 3. Multiple commenters say "it's not worth it" due to abatement + secondary tax
# 4. Person says "I'm not eligible for SLP" — but they likely ARE
# 5. The 70% abatement poverty trap makes working barely worthwhile on JS
# 6. SLP has 30% abatement — dramatically different outcome
#
# This differs from reddit-slp-vs-jobseeker-medical.yaml:
# That person is NOT working. This person IS working (13hrs, min wage)
# and the scenario focuses on the tax/abatement interaction.

scenario:
  name: "JS-Medical recipient working part-time — tax and abatement trap"
  description: >
    28yo NZ citizen with a permanent disability, work capacity <15 hrs/wk,
    on Jobseeker Support with medical certificate. Working 13 hrs/wk at
    minimum wage ($23.15/hr = ~$301/wk). Single, renting. Confused about
    tax codes and whether working is "worth it." The tool should surface
    SLP as the correct benefit (30% abatement vs 70%) and show how much
    more they'd keep on SLP while working.

intake_answers:
  # PERSONAL
  personal.age: 28
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 28
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 250
  housing.region: "Other"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "Yes"
  income.hours: 13
  income.amount: 301
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Transport to appointments"
  health.hours_able: "Less than 15 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: supported-living-payment
      status: ENTITLED
      reasoning: >
        This is the KEY finding. Person has permanent disability limiting work
        capacity to <15 hrs/wk, age 28, NZ citizen, resident 28 years. Meets
        all 5 SLP rules: age ≥18, has_condition, work_capacity_under_15,
        residency citizen/PR, years_in_nz ≥2. Person says "I'm not eligible
        for SLP" but they almost certainly are. The financial difference while
        working is dramatic: SLP abatement 30c/$1 vs JS 70c/$1. At $301/wk
        earnings, switching to SLP gains ~$77/wk net.

    - id: jobseeker-support
      status: ENTITLED
      reasoning: >
        Currently receiving this benefit. All criteria met. However, SLP is
        the more appropriate benefit given <15hr work capacity.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting at $250/wk, single, on benefit. Meets all criteria.

    - id: disability-allowance
      status: ENTITLED
      reasoning: >
        Has permanent disability with ongoing costs (GP visits, medication,
        transport). Both rules pass: has_condition=true and
        has_ongoing_disability_costs=true. Max $75.52/wk non-taxable.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. WEP is automatic May-October. $20.46/wk single.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement. Discounted GP visits
        and prescriptions, critical given ongoing health costs.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        On benefit with employment income, but housing costs ($250/wk) may
        still exceed residual income after abatement. TAS requires essential
        cost breakdown at appointment.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, not a sole parent"
    - id: childcare-assistance
      reasoning: "No children"

# Income analysis: the abatement trap in numbers
# This is the core value of this scenario — showing why "it's not worth it"
# on JS but IS worth it on SLP
income_analysis:
  employment:
    hours_per_week: 13
    hourly_rate: 23.15
    gross_weekly: 301  # 13 × $23.15 = $300.95, rounded

  on_jobseeker:
    base_weekly_gross: 337.74
    abatement_threshold: 160
    abatement_rate: 0.70
    abatement_amount: 98.70      # ($301 - $160) × 0.70
    js_after_abatement: 239.04   # $337.74 - $98.70
    benefit_paye_m_code: 35.86   # ~15% of $239.04
    benefit_net: 203.18          # $239.04 - $35.86
    employment_paye_s_code: 52.68  # ~17.5% secondary tax on $301
    employment_net: 248.32       # $301 - $52.68
    total_net_weekly: 451.50     # $203.18 + $248.32
    compared_to_not_working: 290 # Approx JS net with no earnings
    net_gain_from_working: 161.50
    effective_hourly_rate: 12.42 # $161.50 / 13 hrs (vs $23.15 nominal)
    effective_marginal_rate: 0.82  # 70% abatement + ~12% residual tax

  on_slp:
    base_weekly_gross: 371.52
    abatement_threshold: 160
    abatement_rate: 0.30
    abatement_amount: 42.30      # ($301 - $160) × 0.30
    slp_after_abatement: 329.22  # $371.52 - $42.30
    benefit_paye_m_code: 49.38   # ~15% of $329.22
    benefit_net: 279.84          # $329.22 - $49.38
    employment_paye_s_code: 52.68
    employment_net: 248.32
    total_net_weekly: 528.16     # $279.84 + $248.32
    net_gain_from_working: 238.16  # vs ~$290 not working
    effective_hourly_rate: 18.32   # $238.16 / 13 hrs

  switching_gain:
    weekly_difference: 76.66     # $528.16 - $451.50
    annual_difference: 3986.32   # $76.66 × 52
    description: >
      Switching from JS to SLP while working 13hrs/wk at minimum wage
      gains ~$77/wk or ~$3,986/year. The effective hourly rate jumps
      from $12.42 to $18.32 — the difference between "not worth it"
      and viable part-time work.

notes:
  - >
    Tax codes: benefit always takes M (primary) tax code, employment gets
    secondary (S) code. This is correct per IRD rules — the larger income
    source (benefit) takes M. Multiple Reddit commenters confirm this.
    Secondary tax is NOT double tax — it's a higher withholding rate to
    approximate the correct total tax across both income sources.
  - >
    The poster incorrectly believes they're not eligible for SLP. Their
    <15hr medical obligations IS the SLP threshold under s40 SSA 2018.
    This is a common misconception — people assume "disability" means
    something more severe than their condition. The legal test is work
    capacity, not diagnosis.
  - >
    Grey area #8 (abatement traps) is directly relevant. On JS, the
    effective marginal rate above the $160 threshold is ~82% (70%
    abatement + tax on the remainder). On SLP it's ~48% (30% abatement
    + tax). This is the difference between poverty-trap economics and
    a viable pathway to part-time work.
  - >
    The advocacy playbooks on both JS and SLP benefit definitions will
    surface in the briefing document, giving the person specific talking
    points for requesting reassessment to SLP.
  - >
    Combined gap estimate: SLP switch ($77/wk) + DA if not receiving
    ($75.52/wk max) + AS if not receiving (varies) = potentially
    $150-250/wk in additional support. Annual impact: $7,800-$13,000.
`,m=`# Test Scenario: Reddit "Relationships when on the benefit"
# Source: reddit.com/r/newzealand — confusion about declaring relationships to WINZ
#
# This person reveals multiple gaps:
#
# 1. RELATIONSHIP DECLARATION GAP:
#    MSD defines "relationship in the nature of marriage" very broadly — sexual
#    engagement alone can count. But the tool's intake only has a simple choice:
#    Single / In a relationship / de facto / Married / Separated / Widowed.
#    There's no way to express "dating someone but not cohabiting, no financial
#    interdependence." This matters because:
#    - If they answer "Single" (correct per Reddit advice) → full entitlements
#    - If MSD classifies them as "in a relationship" with partner earning
#      $67,500/yr ($1,298/wk) → could lose benefit entirely
#    The Reddit consensus: don't declare until living together. But the tool
#    can't surface this advice or model the risk.
#
# 2. WRONG BENEFIT TYPE:
#    Person says "disability prevents full-time work" and "full-time was deeply
#    destructive even with accommodations." They've worked part-time consistently.
#    They're on plain Jobseeker but should arguably be on JS-Medical (medical
#    deferral from full-time work obligations) or SLP if capacity is <15hrs.
#
# 3. MISSING SUPPLEMENTS:
#    Trans person with disability — almost certainly has ongoing health costs
#    (HRT, specialist visits, GP visits, prescriptions) that would qualify
#    for Disability Allowance. Likely also missing Accommodation Supplement
#    and Temporary Additional Support given "majority of income goes to food
#    and rent with little else to spare."
#
# 4. PARTNER INCOME TESTING NOT MODELLED:
#    No benefit rules currently use has_partner or household_income as facts.
#    In reality, MSD applies partner income testing that can dramatically
#    reduce or eliminate benefit. This is a known gap in the rules engine.
#
# Reddit thread key quotes:
# - "Don't say anything until you start living together" (162 upvotes)
# - "Keep all finances completely separate"
# - "Don't put it on socials, no photos"
# - "I'm ace, and they declared me and my ex as a couple, even though we
#    didn't have sex, didn't live together, and didn't share expenses"
# - "MSD are very heavy handed in what they consider a 'relationship'"
# - "Electoral roll addresses get automatically picked up by WINZ"

scenario:
  name: "Disabled person on Jobseeker — relationship declaration risk"
  description: >
    26yo trans man, NZ citizen, on Jobseeker Support. Has a permanent disability
    that prevents full-time work — part-time only. Actively seeking work for 2+
    years. Renting in Canterbury, most income goes to food and rent. Has ongoing
    health costs (GP, prescriptions — likely including HRT and specialist visits).
    Not currently in official relationship but has a person who will "eventually
    become my romantic partner" — currently broke, will soon earn $67,500/yr.
    They don't live together and partner doesn't contribute financially.
    Modelled as Single (correct for WINZ purposes per Reddit consensus).

intake_answers:
  # PERSONAL
  personal.age: 26
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 26
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 250
  housing.region: "Canterbury / Christchurch"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Transport to appointments"
  health.hours_able: "15 – 30 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.unemployment_duration: "More than 12 months"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: jobseeker-support
      status: ENTITLED
      reasoning: >
        18+, NZ citizen, resident 2+ years, seeking work. Currently on JS
        already, but the tool should confirm entitlement. Note: should arguably
        be on JS-Medical given permanent disability limiting work capacity.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting at $250/wk in Canterbury (Zone 2), single, on benefit.
        Max AS for Zone 2 is ~$250/wk. Says "majority of income goes to
        food and rent" — AS would directly address the housing cost burden.

    - id: disability-allowance
      status: ENTITLED
      reasoning: >
        Has permanent condition with ongoing GP/specialist visits,
        prescriptions (likely including HRT for gender-affirming care),
        and transport costs. Classic DA candidate. This is almost certainly
        not being received — they say they get "none of these" supplements.
        DA can cover: prescriptions, GP co-pays, specialist visits,
        transport to medical appointments, and other ongoing health costs.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement. Reduces GP visits
        and prescription costs. Critical given ongoing health costs.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. Automatic May-October payment.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        On benefit, costs likely exceed income. "Majority of income goes to
        food and rent with little else to spare" — this is exactly what TAS
        is designed for. Requires essential cost breakdown at appointment.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, not a sole parent"
    - id: working-for-families
      reasoning: "No dependent children"
    - id: childcare-assistance
      reasoning: "No children"
    - id: student-allowance
      reasoning: "Not a student"
    - id: student-loan-living-costs
      reasoning: "Not a student"

# What happens if MSD classifies them as "in a relationship"
# This comparison illustrates why the relationship question matters so much
relationship_impact_analysis:
  as_single:
    js_base_rate: "$337.74/wk"
    plus_supplements: "AS (~$165/wk) + DA (~$75/wk) + TAS + WEP = potentially $500+/wk total"
    outcome: "Full entitlements, can survive"

  if_declared_in_relationship_partner_earning_67500:
    partner_weekly_gross: "$1,298/wk"
    js_couple_rate: "$562.18/wk (combined)"
    partner_income_abatement: "At $1,298/wk, benefit reduced to $0 after abatement"
    outcome: "Benefit cancelled entirely. Partner not actually supporting them."
    real_world_impact: >
      Person loses ALL income support despite partner not contributing
      financially. The assumption that romantic partnership = financial
      support is the core injustice the Reddit thread identifies.

# Gaps this scenario reveals in the tool
identified_gaps:
  relationship_question:
    current: "Simple choice: Single / In a relationship / Married / etc."
    needed: >
      The tool needs to distinguish between:
      1. Single (no romantic partner)
      2. Dating / casual (not cohabiting, no financial interdependence)
      3. De facto / cohabiting (shared household, MSD counts this)
      4. Married / civil union
      The current question conflates 2 and 3, which have radically
      different benefit implications. At minimum, the tool should warn
      users about the consequences of relationship declaration and the
      distinction between "relationship" and "relationship in the nature
      of marriage" under s3 Social Security Act 2018.

  partner_income_rules:
    current: "No benefit rules use has_partner or household_income facts"
    needed: >
      Partner income testing should be modelled for main benefits.
      When on_benefit=true and has_partner=true and partner_income is
      high, the tool should flag risk of benefit reduction/cancellation.
      Currently the tool cannot warn about this — a critical blind spot.

  js_medical_vs_plain_js:
    current: "Tool surfaces JS as ENTITLED but can't distinguish JS vs JS-Medical"
    needed: >
      Person has permanent disability but selected "15-30 hrs" work capacity.
      They should be on JS-Medical (medical deferral from full-time work
      obligations) but the tool can't currently recommend this variant.
      JS-Medical means: no job search requirements, reviewed every 13 weeks
      with medical cert. Without it, they face work test sanctions despite
      their disability.

notes:
  - >
    The relationship declaration issue is arguably the highest-stakes gap in
    the NZ welfare system. A person can go from ~$500/wk in support to $0
    overnight based on MSD's determination of "relationship in the nature
    of marriage" — even when the partner isn't contributing financially.
  - >
    The Reddit consensus (162+ upvotes) is: "Don't say anything until you
    start living together." This is pragmatic survival advice. MSD's own
    guidelines (s3 SSA 2018) define the factors as: living together, financial
    interdependence, commitment, children together, public reputation. But in
    practice, commenters report MSD classifying relationships based on social
    media, electoral roll addresses, and even a single use of the word
    "girlfriend."
  - >
    This person is almost certainly missing DA ($75/wk), AS ($165/wk), and
    possibly TAS — potentially $200-300/wk in additional support. Combined
    with the risk of losing everything if they declare a relationship, this
    represents a ~$700/wk swing in outcomes.
  - >
    Trans health costs are a specific DA blind spot. HRT prescriptions,
    endocrinologist visits, and mental health support are all DA-eligible
    costs. Case managers may not proactively inform trans clients of this.
  - >
    The "seeking work for multiple years" detail suggests this person has
    barriers to employment (possibly discrimination-related) that should
    trigger referral to employment programmes like Flexi-wage or Mana in
    Mahi — but they answered "No" to training interest, so the tool won't
    surface those.
`,g=`# Test Scenario: Reddit "Renting while on WINZ with medical"
# Source: reddit.com/r/newzealand — person wanting to leave home for first time
#
# This person reveals a cluster of issues:
# 1. 29yo, never lived independently, in a cabin at mum's house
# 2. Multiple health conditions, declining — "virtually impossible to work"
# 3. Has a partner, BOTH becoming physically disabled
# 4. Both on WINZ with medical certificates
# 5. Cabin has steps that are becoming inaccessible (spinal injury, walking aid)
# 6. Needs to move to accessible, independent housing
# 7. Worried WINZ won't help because new place is "more expensive"
# 8. Worried landlords won't accept two beneficiaries
#
# Reddit insights:
# - "Just do it and tell WINZ after" — move first, update details (top comment)
# - Should get AS increase, DA, TAS after moving to independent rental
# - Social housing (Kainga Ora) suggested — accessibility needs put you higher on list
# - Water costs can be included in AS calculation
# - Power costs on DA if medical reason (e.g., medical devices)
# - Budget advisor recommended as less stressful than WINZ directly
# - OP clarified: classified as renter not boarder (pays rent + buys own food)
# - OP already gets small AS
#
# Key gap: "virtually impossible to work" + physical disability + spinal injury
# strongly suggests <15hr work capacity → SLP, not just JS-Medical.
# Both partners may qualify for SLP independently.

scenario:
  name: "Couple on JS-Medical — first independent rental, accessibility needs"
  description: >
    29yo NZ citizen with multiple chronic conditions and declining health,
    including spinal injury requiring walking aids. Work capacity virtually nil.
    Has a partner who is also becoming physically disabled — both on WINZ with
    medical certificates. Currently living in a small cabin at mother's property,
    paying rent. Needs to move to accessible independent housing. Steps in/out
    of cabin becoming dangerous. Worried WINZ won't support the move because
    new rent is higher. The tool should surface SLP for both (not just JS),
    housing assistance (bond, moving costs), accessibility support, and the
    full supplement stack they're likely missing.

intake_answers:
  # PERSONAL
  personal.age: 29
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 29
  personal.relationship: "In a relationship / de facto"
  personal.partner_employed: "No"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 200
  housing.region: "Other"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "Yes"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Transport to appointments"
    - "Equipment or aids"
    - "Home modifications needed"
  health.hours_able: "Less than 15 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: supported-living-payment
      status: ENTITLED
      reasoning: >
        This is the KEY finding. "Virtually impossible to work" + spinal injury
        + multiple chronic conditions + declining health = work capacity well
        under 15 hrs. Meets all SLP criteria: age ≥18, has_condition,
        work_capacity_under_15, NZ citizen, resident 2+ years. SLP pays
        $371.52/wk vs JS $337.74/wk for single (couple rates higher). More
        critically: SLP has no work test obligations and 30% abatement vs 70%.
        Partner should also apply for SLP independently — both becoming
        physically disabled. Reddit commenter specifically suggested SLP.

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting, not in social housing. Currently getting small AS at mum's.
        When they move to independent rental, AS will likely increase
        significantly — new rent will be assessed fresh. Can include water
        costs in AS calculation per Reddit advice.

    - id: disability-allowance
      status: ENTITLED
      reasoning: >
        Has permanent condition with extensive ongoing costs: GP visits,
        prescriptions, transport, equipment/aids (walking aid mentioned),
        home modifications. Both rules pass: has_condition=true and
        has_ongoing_disability_costs=true. Max $75.52/wk non-taxable.
        Both partners can claim DA separately. This is almost certainly
        not being received — they say "none of these" for supplements.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        On benefit, no employment income, housing costs. Essential costs
        likely exceed income — especially once in independent rental with
        power/water bills on top of rent. TAS requires cost breakdown.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. Automatic May-October. Particularly relevant
        as current rent includes power but new place won't.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement. Critical given
        frequent GP/specialist visits for multiple conditions.

    - id: bond-grant
      status: ENTITLED
      reasoning: >
        Renting + needs_to_move=true + low_income=true. All 3 rules pass.
        Moving to first independent rental — will need bond money.
        Top Reddit commenter advised having bond money ready but WINZ
        can provide this as a grant.

    - id: house-modifications
      status: ENTITLED
      reasoning: >
        Has condition + needs_home_modifications (selected in health costs).
        Spinal injury, needs walking aid, steps are dangerous. New housing
        may need grab rails, ramp access, wider doorways. This benefit
        covers accessibility modifications.

    - id: special-needs-grant
      status: ENTITLED
      reasoning: >
        On benefit + low income + has essential need (moving, setting up
        new household). Can cover furniture, whiteware, bedding for first
        independent home. Never lived independently before — will need
        everything.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, has partner"
    - id: childcare-assistance
      reasoning: "No children"
    - id: student-allowance
      reasoning: "Not a student"
    - id: orphans-benefit
      reasoning: "No children in care"
    - id: working-for-families
      reasoning: "No dependent children"

# Housing transition analysis
housing_analysis:
  current_situation:
    description: "Small one-room cabin at mother's property"
    rent: 200
    includes: "Power, water, kitchen/bathroom access in main house"
    problems:
      - "Steps in/out of cabin becoming inaccessible due to physical disability"
      - "Not enough room for walking aid (spinal injury)"
      - "Shared kitchen/bathroom requires traversing steps each time"
      - "Partner also becoming physically disabled — cabin unsuitable for two"
      - "No security or stability ('things always broken, yelling')"
    current_supplements: "Small AS only — likely missing DA, TAS, SNG"

  proposed_move:
    description: "Independent accessible rental for couple"
    estimated_rent: 300
    excludes: "Power, water (not included like current place)"
    estimated_power: 40
    estimated_water: 15
    total_housing_cost: 355
    benefits:
      - "Accessible — no steps, room for mobility aids"
      - "Independent kitchen/bathroom"
      - "Suitable for two people with mobility needs"
      - "Stability and safety"

  winz_concern:
    op_worry: "WINZ won't help because it's a 'more expensive situation'"
    reality: >
      WINZ cannot refuse AS increase just because new rent is higher.
      AS is calculated on actual housing costs. Moving from an unsuitable
      cabin to accessible housing is a legitimate housing need. The
      current $200 rent artificially suppresses their AS entitlement.
      After moving: AS recalculated on new rent, TAS can cover the
      gap between income and essential costs, DA covers disability-
      related costs. Total support should increase substantially.

  financial_comparison:
    current_weekly_income:
      js_couple_base: 562.18
      as_current: 70   # small AS on low rent
      total_gross: 632.18
      rent: 200
      after_rent: 432.18
      note: "Power/water included in rent. No DA, no TAS claimed."

    after_moving:
      js_couple_base: 562.18    # or SLP couple if switched
      as_new: 165               # increased on higher rent
      da_estimate: 75           # both could claim separately
      tas_estimate: 50          # essential cost gap
      wep: 20.46
      total_gross: 872.64
      rent: 300
      power_water: 55
      after_rent_utilities: 517.64
      note: >
        Even with higher rent + new utility bills, total after-housing
        income increases by ~$85/wk because they're now claiming
        supplements they were previously missing. If switched to SLP,
        base rate increases further.

    slp_scenario:
      slp_couple_base: 619.20   # SLP couple rate
      difference_from_js: 57.02  # per week
      annual_gain: 2965.04
      note: >
        Both partners likely qualify for SLP individually. Combined
        SLP couple rate is higher than JS couple rate. No work test
        obligations. Better abatement if either ever works part-time.

notes:
  - >
    This person has never lived independently at 29 — the transition is
    daunting and WINZ bureaucracy adds fear. The top Reddit advice is
    pragmatic: move first, tell WINZ after, provide tenancy agreement.
    Don't ask permission — inform them of the change.
  - >
    The accessibility angle is critical and underappreciated. Spinal
    injury + walking aid + inaccessible steps = potential eligibility
    for social housing (Kainga Ora) at higher priority. Multiple
    Reddit commenters suggested this path. Social housing isn't
    modelled in the tool yet but is the strongest long-term option.
  - >
    Both partners being on medical certificates suggests both may
    qualify for SLP independently. The tool can only assess the
    primary user, but the briefing document should note that the
    partner should seek their own assessment.
  - >
    The "no landlord will take two beneficiaries" concern from the
    Reddit thread is real but not a legal barrier — discrimination
    based on income source is not explicitly prohibited in the
    Residential Tenancies Act, but many landlords/property managers
    accept WINZ tenants routinely. Social housing bypasses this entirely.
  - >
    House modifications benefit is particularly relevant here. The
    current cabin situation demonstrates the need — couldn't use
    walking aid due to space constraints. A new rental may need
    grab rails, ramp, or other modifications that WINZ can fund.
  - >
    Budget advisor recommendation from Reddit is sound — they can
    help prepare the financial case for WINZ, document essential
    costs for TAS, and reduce the stress of dealing with WINZ
    directly. Many are free through community organisations.
`,f=`# Test Scenario: Reddit "SLP vs Jobseekers with medical certificate"
# Source: reddit.com/r/newzealand — discussion about being stuck on Jobseeker
# with medical deferral when SLP would be more appropriate
#
# This person represents a common pattern:
# 1. Has a permanent/long-term condition limiting work to <15 hrs/wk
# 2. Is on Jobseeker Support with medical certificate (JS-Medical)
# 3. Should arguably be on Supported Living Payment (SLP) which:
#    - Pays more ($371.52/wk vs $337.74/wk base rate)
#    - Has far more generous abatement (30c/$1 vs 70c/$1 above threshold)
#    - Has no work test obligations
#    - Is harder to get — MSD actively resists granting it
# 4. The friction is the key insight: "incredibly difficult to get granted
#    even if doctors sign it off"
#
# Reddit thread reveals:
# - Multiple people reporting MSD refusing SLP despite doctor certification
# - People stuck on JS-Medical for years when they legally qualify for SLP
# - The 70c/$1 abatement on JS makes part-time work financially punishing
# - SLP's 30c/$1 abatement would make part-time work viable
# - Some people don't even know SLP exists as an option

scenario:
  name: "SLP candidate stuck on Jobseeker — medical deferral"
  description: >
    Adult 40+ with a permanent disability/condition that limits work capacity to
    under 15 hours per week. Currently on Jobseeker Support with a medical
    certificate (JS-Medical) but should be assessed for Supported Living Payment.
    Not currently working due to condition severity. Renting in Auckland.
    Single, no children. Has ongoing health-related costs including medication,
    specialist visits, and extra power for heating. This is a gatekeeping scenario —
    the person legally qualifies for SLP but MSD has kept them on JS-Medical.

intake_answers:
  # PERSONAL
  personal.age: 42
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 42
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 350
  housing.region: "Auckland"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "Yes"
  health.duration: "Permanent / lifelong"
  health.costs: "Yes"
  health.cost_types:
    - "GP / specialist visits"
    - "Prescriptions / medication"
    - "Extra power / heating"
    - "Transport to appointments"
  health.hours_able: "Less than 15 hrs"
  health.residential_care: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EMPLOYMENT
  employment.seeking_work: "No"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"
  history.upload: "Skip for now"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: supported-living-payment
      status: ENTITLED
      reasoning: >
        This is the KEY finding. Person has a permanent condition limiting work
        capacity to <15 hrs/wk, is 18+, NZ citizen, resident 2+ years.
        Meets all statutory criteria for SLP under s40 Social Security Act 2018.
        SLP pays $371.52/wk vs JS $337.74/wk — a $33.78/wk difference on base
        rate alone. More critically, SLP abatement is 30c/$1 vs JS 70c/$1,
        meaning if they ever manage part-time work, they keep far more earnings.
        MSD friction: "incredibly difficult to get granted even if doctors sign it off"

    - id: accommodation-supplement
      status: ENTITLED
      reasoning: >
        Renting at $350/wk in Auckland (Zone 1), single no children.
        Max AS for this profile in Area 1 is $165/wk. On benefit income only,
        well under the income threshold. Almost certainly not receiving this
        if they say they're getting "none of these" supplements.

    - id: disability-allowance
      status: POSSIBLE
      reasoning: >
        Has permanent condition with ongoing GP, specialist, medication,
        transport, and extra power costs. Classic DA candidate. Max $75.52/wk.
        Requires itemised costs from GP. This is the most commonly missed
        supplement — many people on JS-Medical don't know about it.

    - id: winter-energy-payment
      status: ENTITLED
      reasoning: >
        On a main benefit. WEP is automatic May-October. $20.46/wk single.
        Has extra power costs already, so this is particularly relevant.

    - id: temporary-additional-support
      status: POSSIBLE
      reasoning: >
        On benefit only (no employment income), paying $350/wk rent in Auckland.
        Benefit income (~$338/wk gross, ~$290 net) doesn't cover rent alone.
        TAS is designed for exactly this shortfall. Requires essential cost
        breakdown at appointment.

    - id: community-services-card
      status: ENTITLED
      reasoning: >
        On a main benefit — automatic entitlement. Gives discounted GP visits
        ($19.50 instead of ~$55-70) and $5 prescriptions. Given they have
        ongoing GP and prescription costs, this is critical. If not already
        held, every appointment is costing them 3x what it should.

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children, not a sole parent"
    - id: childcare-assistance
      reasoning: "No children"
    - id: orphans-benefit
      reasoning: "No children in care"
    - id: working-for-families
      reasoning: "No dependent children"

# Financial comparison: JS-Medical vs SLP
# This is what the tool should help people understand
benefit_comparison:
  jobseeker_medical:
    base_weekly_gross: 337.74
    base_weekly_net: ~290.00
    abatement_threshold: 160
    abatement_rate: 0.70
    work_test: "Medical certificate deferral (renewed every 13 weeks)"
    effective_marginal_tax_above_threshold: ~0.82  # 70% abatement + tax on remainder
    friction_notes:
      - "Must renew medical certificate every 13 weeks"
      - "Case manager may challenge medical cert at any renewal"
      - "Work test obligations technically still apply — need medical deferral"
      - "Can be reclassified to work-ready JS at any review"

  supported_living_payment:
    base_weekly_gross: 371.52
    base_weekly_net: ~318.00
    abatement_threshold: 160
    abatement_rate: 0.30
    work_test: "None"
    effective_marginal_tax_above_threshold: ~0.48  # 30% abatement + tax on remainder
    friction_notes:
      - "Requires work capacity medical assessment (separate from GP cert)"
      - "MSD designated doctor may override treating specialist opinion"
      - "Assessment focuses on ANY work, not the person's previous occupation"
      - "Appeals process exists but takes months"
      - "Reddit: 'incredibly difficult to get granted even if doctors sign it off'"

  weekly_difference:
    base_rate: 33.78
    if_working_10hrs_at_25:
      js_medical_net_gain: ~45.00   # After 70% abatement + tax
      slp_net_gain: ~130.00         # After 30% abatement + tax
      difference: ~85.00            # SLP makes part-time work viable

notes:
  - >
    The core Reddit insight: MSD has a financial incentive to keep people on
    JS-Medical rather than granting SLP. JS has harsher abatement (70c vs 30c)
    and work test obligations that can be used to sanction/reduce payments.
    SLP removes these control mechanisms.
  - >
    Multiple Reddit commenters report being denied SLP despite specialist
    letters confirming <15hr work capacity. The designated doctor system
    allows MSD to override treating clinicians.
  - >
    This scenario tests whether the engine correctly identifies SLP as an
    entitlement when the person meets all statutory criteria but is currently
    on JS-Medical. The tool's value is in surfacing this option so the person
    can advocate for reassessment.
  - >
    The missing supplements (AS, DA, TAS, CSC) represent potentially $200-300/wk
    in additional support this person is likely not receiving. Combined with
    the SLP base rate increase, the total gap could be $250-350/wk.
  - >
    Key advocacy point: Under s40 Social Security Act 2018, if work capacity
    is restricted to <15hrs/wk by a health condition, SLP is the correct
    benefit. There is no discretion — if the medical threshold is met, SLP
    must be granted. The friction is in the assessment process, not the law.
`,y=`# Test Scenario: Transition analysis — single on Jobseeker, no kids
# Expected: trap verdict — Accommodation Supplement loss dominates
#
# This person earns $100/wk part-time while on Jobseeker Support. When they
# go full-time at minimum wage, they lose the benefit + AS (~$165/wk in zone 2)
# and gain only the net of employment income. The housing cliff is brutal.

scenario:
  name: "Transition — JS single, no kids, renting"
  description: >
    Single person 30, on Jobseeker Support, earning $100/wk part-time (under
    abatement threshold). Renting in Canterbury at $280/wk. Has no children.
    No health condition. The transition calculator should show that going
    full-time at minimum wage is a trap due to AS loss.

intake_answers:
  # TRIAGE
  triage.reason: "Full assessment of everything I might be entitled to"

  # PERSONAL
  personal.age: 30
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 30
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 280
  housing.region: "Canterbury / Christchurch"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "Yes"
  income.hours: 10
  income.amount: 100
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.unemployment_duration: "1 – 3 months"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: jobseeker-support
      status: ENTITLED
      reasoning: "Meets all criteria — on benefit, seeking work, age 30, citizen"
    - id: accommodation-supplement
      status: ENTITLED
      reasoning: "Renting, single, Canterbury zone 2"

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children"
    - id: supported-living-payment
      reasoning: "No health condition"

# Transition analysis expectations
transition_expected:
  verdict: better_working
  reasoning: >
    Current: $337/wk JS + $100/wk earnings (under threshold) - $12 tax/ACC + $105 AS + $97 TAS + $32 WEP = ~$659/wk.
    Full-time min wage off-benefit: $926 gross - $158 tax/ACC + $60 AB = ~$828/wk net.
    Net gain: +$168/wk. Clearly better_working. The AS→AB cliff ($105→$60 = $45/wk loss) is real
    but insufficient to offset the earnings gain at 40hrs min wage for a single person.

notes:
  - >
    The key insight: this person would need to earn significantly above minimum wage
    to clearly be better off working. The $105/wk AS cliff is the main trap mechanism.
  - >
    This scenario tests the transition engine's ability to correctly compute the
    housing cliff and arrive at a "trap" verdict for a single person with no children.
`,w=`# Test Scenario: Transition analysis — sole parent on SPS with kids
# Expected: better_working verdict at ~30hrs — IWTC + MFTC compensate
#
# Solo parent on Sole Parent Support with 2 children, renting in Auckland.
# When they go full-time, they lose AS but gain IWTC ($72.46/wk) and MFTC
# (income floor to $598/wk). The work incentives are designed for this case.

scenario:
  name: "Transition — SPS, 2 kids, renting Auckland"
  description: >
    Solo parent 32, on Sole Parent Support, not currently employed. Two children
    aged 3 and 7. Renting in Auckland at $450/wk. The transition calculator should
    show that going to 20+ hours at minimum wage is "better_working" due to
    IWTC and MFTC kicking in.

intake_answers:
  # TRIAGE
  triage.reason: "Full assessment of everything I might be entitled to"

  # PERSONAL
  personal.age: 32
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 32
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 450
  housing.region: "Auckland"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "No"
  income.hours: 0
  income.amount: 0
  income.benefit: "Yes"
  income.benefit_type: "Sole Parent Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "No"

  # CHILDREN
  children.dependent: "Yes"
  children.count: 2
  children.ages:
    - "3 – 4 years"
    - "5 – 13 years"
  children.childcare: "Yes"
  children.disability: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.unemployment_duration: "4 – 12 months"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: sole-parent-support
      status: ENTITLED
      reasoning: "Sole parent, 2 kids under 14, citizen, resident"
    - id: accommodation-supplement
      status: ENTITLED
      reasoning: "Renting in Auckland (zone 1), sole parent"
    - id: childcare-assistance
      status: POSSIBLE
      reasoning: "Has children in childcare, on benefit"

  should_not_surface:
    - id: supported-living-payment
      reasoning: "No health condition"

# Transition analysis expectations
transition_expected:
  verdict: trap
  reasoning: >
    Current: $434/wk SPS + $305/wk AS (Auckland zone 1, sole parent 2+ kids) + $32 WEP = ~$772/wk.
    Full-time min wage off-benefit: $926 gross - tax/ACC + IWTC $72 + AB $60 = ~$900/wk net
    BEFORE childcare. With 1 child aged 3-4 ($150/wk childcare), net drops to ~$750/wk.
    Net loss: ~-$21/wk — trap. The childcare cost for the pre-school child wipes out the
    work incentive gains. Once the child turns 5 and enters school, the verdict flips to
    better_working.

notes:
  - >
    Before childcare costs were modelled, this scenario showed better_working because
    IWTC ($72.46/wk) and the lower SPS abatement rate (30c vs 70c) compensated for
    lost supplements. With realistic childcare costs for the 3-year-old ($150/wk),
    the economics flip to trap — demonstrating why childcare is the key barrier.
  - >
    The MFTC provides a guaranteed floor of $598/wk — if net income would
    be lower, MFTC tops up the difference. This is the safety net for
    low-wage sole parents that most people don't know exists.
  - >
    Once the 3-year-old turns 5 and enters school, childcare costs drop to zero
    and the verdict returns to better_working. This is the key insight the tool
    now surfaces — timing matters for the transition decision.
`,b=`# Test Scenario: Study transition — single on Jobseeker, considering study
# Expected: study verdict "trap" — SA + AB much less than current benefit + supplements
#
# This models the Reddit WINZ→StudyLink cliff. Person on JS with AS and supplements
# would lose ~$160/wk switching to Student Allowance + Accommodation Benefit.
# Stay-on-benefit + TIA is the financially dominant option for short courses.

scenario:
  name: "Study transition — JS single 30, renting Canterbury"
  description: >
    Single person 30, on Jobseeker Support, earning $100/wk part-time. Renting in
    Canterbury at $280/wk. No children, no health condition. Considering study.
    The study transition calculator should show that switching to Student Allowance
    is a trap (SA $340 + AB $60 - tax ≈ $377/wk vs current ~$540/wk on benefit).
    Stay on benefit + TIA should be flagged as the better option.

intake_answers:
  # TRIAGE
  triage.reason: "Full assessment of everything I might be entitled to"

  # PERSONAL
  personal.age: 30
  personal.residency: "NZ Citizen"
  personal.years_in_nz: 30
  personal.relationship: "Single"

  # HOUSING
  housing.type: "Renting"
  housing.cost: 280
  housing.region: "Canterbury / Christchurch"
  housing.social_housing: "No"
  housing.arrears: "No"
  housing.need_to_move: "No"

  # INCOME
  income.employed: "Yes"
  income.hours: 10
  income.amount: 100
  income.benefit: "Yes"
  income.benefit_type: "Jobseeker Support"
  income.current_supplements:
    - "None of these"
  income.assets: "Under $8,100"

  # HEALTH
  health.condition: "No"

  # CHILDREN
  children.dependent: "No"
  children.caring_for_other: "No"

  # EDUCATION
  education.studying: "No"

  # EMPLOYMENT
  employment.seeking_work: "Yes"
  employment.unemployment_duration: "1 – 3 months"
  employment.training_interest: "No"
  employment.seasonal: "No"
  employment.self_employed: "No"

  # HISTORY
  history.past_denied: "No"

  # SITUATION
  situation.emergency: "No"
  situation.family_violence: "No"
  situation.recently_released: "No"
  situation.refugee: "No"
  situation.carer: "No"

expected_entitlements:
  should_surface:
    - id: jobseeker-support
      status: ENTITLED
      reasoning: "On benefit, seeking work, age 30, citizen"
    - id: accommodation-supplement
      status: ENTITLED
      reasoning: "Renting, single, Canterbury zone 2"

  should_not_surface:
    - id: sole-parent-support
      reasoning: "No children"
    - id: supported-living-payment
      reasoning: "No health condition"

transition_expected:
  verdict: better_working
  study_verdict: trap
  reasoning: >
    Current: $337/wk JS + $100/wk earnings - $12 tax/ACC + $105 AS + $97 TAS + $32 WEP = ~$659/wk.
    Work: FT min wage $828/wk net — better_working (+$168/wk).
    Student Allowance: SA $340/wk - $45 tax/ACC + AB $60 = ~$354/wk — massive cliff (-$305/wk).
    Stay on benefit + TIA: ~$659 + $107 = ~$766/wk — the best study option.
    Student Loan: $317/wk but it's debt, not income.
    Study verdict: trap (SA net is >$20/wk less than current).

notes:
  - >
    This is the scenario from the Reddit post where someone on JS was told to switch
    to StudyLink for a short course. The $535→$429/wk cliff (their numbers) makes
    study financially punishing unless you stay on benefit and use TIA.
  - >
    TIA is capped at $5,550.80/yr and requires NZQF 1-7 course approval from case
    manager. For courses above NZQF 7 (postgrad), TIA is not available — must switch
    to Student Allowance or take Student Loan.
`,S=Object.assign({"../../../tests/scenarios/grey-areas.yaml":s,"../../../tests/scenarios/reddit-benefit-cut-missed-appointment.yaml":r,"../../../tests/scenarios/reddit-couple-jobseeker-breastfeeding.yaml":l,"../../../tests/scenarios/reddit-da-declined-power-heating.yaml":c,"../../../tests/scenarios/reddit-jobseeker-medical.yaml":d,"../../../tests/scenarios/reddit-js-medical-casual-to-permanent.yaml":h,"../../../tests/scenarios/reddit-js-medical-studying.yaml":u,"../../../tests/scenarios/reddit-js-medical-tax-working.yaml":p,"../../../tests/scenarios/reddit-relationship-declaration-on-benefit.yaml":m,"../../../tests/scenarios/reddit-renting-winz-medical-couple.yaml":g,"../../../tests/scenarios/reddit-slp-vs-jobseeker-medical.yaml":f,"../../../tests/scenarios/transition-js-single.yaml":y,"../../../tests/scenarios/transition-sps-with-kids.yaml":w,"../../../tests/scenarios/transition-study-js-single.yaml":b}),v=Object.entries(S).filter(([e])=>!e.includes("grey-areas")).map(([e,n])=>{const t=a(n),i=t.scenario??{},o=e.split("/").pop().replace(".yaml","");return{id:o,name:i.name??o,description:i.description??"",notes:t.notes??[],answers:t.intake_answers??{}}}).sort((e,n)=>e.name.localeCompare(n.name));export{v as TEST_SCENARIOS};
