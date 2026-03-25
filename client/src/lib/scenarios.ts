import { load as loadYaml } from 'js-yaml'
import type { IntakeAnswers } from './types'

export type TestScenario = {
  id: string
  name: string
  description: string
  notes: string[]
  answers: IntakeAnswers
}

const modules = import.meta.glob('../../../tests/scenarios/*.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export const TEST_SCENARIOS: TestScenario[] = Object.entries(modules)
  .filter(([path]) => !path.includes('grey-areas'))
  .map(([path, raw]) => {
    const parsed = loadYaml(raw) as Record<string, unknown>
    const scenario = (parsed.scenario ?? {}) as Record<string, unknown>
    const filename = path.split('/').pop()!.replace('.yaml', '')
    return {
      id: filename,
      name: (scenario.name as string) ?? filename,
      description: (scenario.description as string) ?? '',
      notes: ((parsed.notes ?? []) as string[]),
      answers: (parsed.intake_answers ?? {}) as IntakeAnswers,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))
