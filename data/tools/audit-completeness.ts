/**
 * Audit benefit YAML completeness
 * Checks: income_test.thresholds populated, rates numeric, legal_basis present, rules non-empty
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const ROOT = path.resolve(import.meta.dirname, '..')
const BENEFITS_DIR = path.join(ROOT, 'benefits')

type Benefit = {
  id: string
  name: string
  category: string
  legal_basis?: string
  eligibility: { rules?: unknown[] }
  rates?: Record<string, unknown>
  income_test?: { applies?: boolean; thresholds?: unknown[] }
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

const files = findYamlFiles(BENEFITS_DIR)
let total = 0
let issues = 0

const report: string[] = []

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const benefit = yaml.load(fs.readFileSync(file, 'utf-8')) as Benefit
  total++

  const problems: string[] = []

  if (!benefit.legal_basis) problems.push('missing legal_basis')
  if (!benefit.eligibility.rules || benefit.eligibility.rules.length === 0) problems.push('no eligibility rules')
  if (!benefit.rates) problems.push('no rates section')
  if (benefit.income_test?.applies && (!benefit.income_test.thresholds || benefit.income_test.thresholds.length === 0)) {
    problems.push('income_test.applies=true but no thresholds')
  }

  // Check rates have at least one numeric-parseable value
  if (benefit.rates) {
    const rateValues = Object.values(benefit.rates).filter(v => typeof v === 'string' && v.startsWith('$'))
    if (rateValues.length === 0 && !benefit.rates.description && !benefit.rates.tables) {
      problems.push('rates has no dollar amounts or description')
    }
  }

  if (problems.length > 0) {
    issues += problems.length
    report.push(`  ${rel}`)
    for (const p of problems) report.push(`    - ${p}`)
  }
}

console.log(`\nAUDIT COMPLETENESS REPORT`)
console.log(`========================`)
console.log(`${total} benefits scanned, ${issues} issues found\n`)

if (report.length > 0) {
  console.log(report.join('\n'))
} else {
  console.log('All benefits pass completeness checks.')
}

console.log('')
process.exit(issues > 0 ? 1 : 0)
