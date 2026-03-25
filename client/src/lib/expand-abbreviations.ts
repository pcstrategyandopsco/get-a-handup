/** Expand abbreviations on first occurrence per text block. Longer keys first to avoid partial matches. */
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bJS-Medical\b/, 'Jobseeker Support — Medical (JS-Medical)'],
  [/\bSSA 2018\b/, 'Social Security Act 2018 (SSA 2018)'],
  [/\bSSAA\b/, 'Social Security Appeals Authority (SSAA)'],
  [/\bIWTC\b/, 'In-Work Tax Credit (IWTC)'],
  [/\bMFTC\b/, 'Minimum Family Tax Credit (MFTC)'],
  [/\bIETC\b/, 'Independent Earner Tax Credit (IETC)'],
  [/\bEMTR\b/, 'Effective Marginal Tax Rate (EMTR)'],
  [/\bWFF\b/, 'Working for Families (WFF)'],
  [/\bSPS\b/, 'Sole Parent Support (SPS)'],
  [/\bSLP\b/, 'Supported Living Payment (SLP)'],
  [/\bSNG\b/, 'Special Needs Grant (SNG)'],
  [/\bRAP\b/, 'Recoverable Assistance Programme (RAP)'],
  [/\bTAS\b/, 'Temporary Additional Support (TAS)'],
  [/\bTIA\b/, 'Training Incentive Allowance (TIA)'],
  [/\bWEP\b/, 'Winter Energy Payment (WEP)'],
  [/\bCSC\b/, 'Community Services Card (CSC)'],
  [/\bROD\b/, 'Review of Decision (ROD)'],
  [/\bOIA\b/, 'Official Information Act (OIA)'],
  [/\bMSD\b/, 'Ministry of Social Development (MSD)'],
  [/\bPAYE\b/, 'Pay As You Earn (PAYE)'],
  [/\bDA\b/, 'Disability Allowance (DA)'],
  [/\bAS\b/, 'Accommodation Supplement (AS)'],
  [/\bAB\b/, 'Accommodation Benefit (AB)'],
  [/\bSA\b/, 'Student Allowance (SA)'],
  [/\bJS\b/, 'Jobseeker Support (JS)'],
]

export function expandAbbreviations(text: string): string {
  let result = text
  for (const [pattern, replacement] of ABBREVIATIONS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement)
    }
  }
  return result
}
