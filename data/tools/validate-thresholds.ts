/**
 * Cross-reference income_test.thresholds in benefit YAMLs against rate tables
 * Flags mismatches between declared thresholds and centralized rates
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const BENEFITS_DIR = path.join(ROOT, 'benefits')
const RATES_DIR = path.join(ROOT, 'rates')

type Threshold = { weekly?: number; abatement_rate?: number }
type Benefit = {
  id: string
  name: string
  income_test?: { applies?: boolean; thresholds?: Threshold[] }
}

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

// Load rate tables
const rateFiles = findYamlFiles(RATES_DIR)
const abatementRates: Record<string, { threshold_weekly: number; rate: number }> = {}

for (const file of rateFiles) {
  const rates = yaml.load(fs.readFileSync(file, 'utf-8')) as Record<string, unknown>
  const abatement = rates.abatement as Record<string, { threshold_weekly: number; rate: number }> | undefined
  if (abatement) {
    for (const [key, val] of Object.entries(abatement)) {
      abatementRates[key] = val
    }
  }
}

// Map benefit IDs to rate table keys
const ID_TO_RATE_KEY: Record<string, string> = {
  'jobseeker-support': 'jobseeker_support',
  'supported-living-payment': 'supported_living_payment',
  'sole-parent-support': 'sole_parent_support',
}

const files = findYamlFiles(BENEFITS_DIR)
let mismatches = 0

console.log(`\nTHRESHOLD VALIDATION`)
console.log(`====================\n`)

for (const file of files) {
  const benefit = yaml.load(fs.readFileSync(file, 'utf-8')) as Benefit
  const thresholds = benefit.income_test?.thresholds
  if (!thresholds || thresholds.length === 0) continue

  const rateKey = ID_TO_RATE_KEY[benefit.id]
  if (!rateKey || !abatementRates[rateKey]) continue

  const central = abatementRates[rateKey]

  for (const t of thresholds) {
    if (t.weekly !== undefined && t.weekly !== central.threshold_weekly) {
      console.log(`MISMATCH: ${benefit.id} threshold ${t.weekly} != rate table ${central.threshold_weekly}`)
      mismatches++
    }
    if (t.abatement_rate !== undefined && t.abatement_rate !== central.rate) {
      console.log(`MISMATCH: ${benefit.id} abatement rate ${t.abatement_rate} != rate table ${central.rate}`)
      mismatches++
    }
  }
}

if (mismatches === 0) {
  console.log('All thresholds match rate tables.')
} else {
  console.log(`\n${mismatches} mismatch(es) found.`)
}

console.log('')
process.exit(mismatches > 0 ? 1 : 0)
