/**
 * Gap report — compares existing benefit YAMLs against known NZ entitlements
 * Outputs missing entitlements with priority
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const BENEFITS_DIR = path.join(ROOT, 'benefits')

// Known NZ entitlements not yet in the dataset
const KNOWN_ENTITLEMENTS = [
  // IRD-administered
  { id: 'best-start-tax-credit', name: 'Best Start Tax Credit', source: 'IRD', priority: 'high' },
  { id: 'family-tax-credit', name: 'Family Tax Credit', source: 'IRD', priority: 'high' },
  { id: 'parental-tax-credit', name: 'Parental Tax Credit', source: 'IRD', priority: 'medium' },
  { id: 'paid-parental-leave', name: 'Paid Parental Leave', source: 'IRD/MSD', priority: 'high' },

  // ACC
  { id: 'acc-weekly-compensation', name: 'ACC Weekly Compensation', source: 'ACC', priority: 'medium' },
  { id: 'acc-lump-sum', name: 'ACC Lump Sum Compensation', source: 'ACC', priority: 'low' },
  { id: 'acc-independence-allowance', name: 'ACC Independence Allowance', source: 'ACC', priority: 'low' },

  // StudyLink
  { id: 'student-allowance', name: 'Student Allowance', source: 'StudyLink', priority: 'high' },
  { id: 'student-loan-living-costs', name: 'Student Loan Living Costs', source: 'StudyLink', priority: 'high' },
  { id: 'course-related-costs', name: 'Course Related Costs', source: 'StudyLink', priority: 'medium' },

  // MoH
  { id: 'funded-family-care', name: 'Funded Family Care', source: 'MoH', priority: 'medium' },
  { id: 'disability-support-services', name: 'Disability Support Services', source: 'MoH', priority: 'medium' },

  // Other MSD
  { id: 'superannuation', name: 'NZ Superannuation', source: 'MSD', priority: 'low' },
  { id: 'veterans-pension', name: 'Veterans Pension', source: 'MSD', priority: 'low' },
  { id: 'transitional-housing', name: 'Transitional Housing', source: 'MSD', priority: 'high' },
]

function findYamlFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findYamlFiles(full))
    else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) results.push(full)
  }
  return results
}

const files = findYamlFiles(BENEFITS_DIR)
const existingIds = new Set<string>()

for (const file of files) {
  const benefit = yaml.load(fs.readFileSync(file, 'utf-8')) as { id: string }
  existingIds.add(benefit.id)
}

const missing = KNOWN_ENTITLEMENTS.filter(e => !existingIds.has(e.id))
const high = missing.filter(e => e.priority === 'high')
const medium = missing.filter(e => e.priority === 'medium')
const low = missing.filter(e => e.priority === 'low')

console.log(`\nGAP REPORT`)
console.log(`==========`)
console.log(`${existingIds.size} benefits in dataset, ${missing.length} known gaps\n`)

if (high.length > 0) {
  console.log(`HIGH PRIORITY (${high.length}):`)
  for (const e of high) console.log(`  - ${e.name} [${e.source}]`)
}
if (medium.length > 0) {
  console.log(`\nMEDIUM PRIORITY (${medium.length}):`)
  for (const e of medium) console.log(`  - ${e.name} [${e.source}]`)
}
if (low.length > 0) {
  console.log(`\nLOW PRIORITY (${low.length}):`)
  for (const e of low) console.log(`  - ${e.name} [${e.source}]`)
}

console.log('')
