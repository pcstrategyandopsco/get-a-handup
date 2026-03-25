import type { RateData } from './types'
import ratesJson from '../../../data/dist/rates.json'

const EFFECTIVE_DATE = '2026-04-01'

export function getRates(): RateData {
  const raw = (ratesJson as Record<string, unknown>)[EFFECTIVE_DATE] ?? ratesJson
  return raw as unknown as RateData
}
