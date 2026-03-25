import { useState, useCallback } from 'react'
import { load as loadYaml } from 'js-yaml'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { ScreenTabs } from './components/ScreenTabs'
import { IntakeScreen } from './components/intake/IntakeScreen'
import { AssessmentScreen } from './components/assessment/AssessmentScreen'
import { DocumentScreen } from './components/document/DocumentScreen'
import { useIntake } from './hooks/useIntake'
import { useRulesEngine } from './hooks/useRulesEngine'
import { useTransition } from './hooks/useTransition'
import { useDocumentSigning } from './hooks/useDocumentSigning'
import { getTriageMode } from './engine/questions'
import type { IntakeAnswers, SignedDocument } from './lib/types'

type Screen = 'intake' | 'assessment' | 'document'

// "Youth Payment / Young Parent Payment" is one option covering two benefits
const BENEFIT_TYPE_EXPANSIONS: Record<string, string[]> = {
  'Youth Payment / Young Parent Payment': ['Youth Payment', 'Young Parent Payment'],
}

function buildAlreadyReceiving(answers: IntakeAnswers): string[] {
  const list: string[] = []

  // Main benefit
  const benefitType = answers['income.benefit_type'] as string | undefined
  if (benefitType && benefitType !== 'Other') {
    const expanded = BENEFIT_TYPE_EXPANSIONS[benefitType]
    if (expanded) list.push(...expanded)
    else list.push(benefitType)
  }

  // Supplements
  const supplements = answers['income.current_supplements'] as string[] | undefined
  if (supplements) {
    list.push(...supplements.filter(s => s !== 'None of these'))
  }

  return list
}

export function App() {
  const intake = useIntake()
  const engine = useRulesEngine(intake.answers, intake.history.length >= 2)
  const transition = useTransition(intake.answers, engine.results, engine.results.length > 0)
  const signing = useDocumentSigning()

  const [screen, setScreen] = useState<Screen>('intake')
  const [signedDoc, setSignedDoc] = useState<SignedDocument | null>(null)

  const triageMode = getTriageMode(intake.answers)
  const assessmentUnlocked = intake.isComplete
  const documentUnlocked = signedDoc !== null

  const handleSaveProgress = useCallback(() => {
    const payload = {
      type: 'entitlement-navigator-session',
      version: 1,
      saved: new Date().toISOString().split('T')[0],
      answers: intake.answers,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entitlement-progress-${payload.saved}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [intake.answers])

  const handleLoadScenario = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const isJson = file.name.endsWith('.json')

      if (isJson) {
        const parsed = JSON.parse(text) as Record<string, unknown>
        const answers = (parsed.answers ?? {}) as IntakeAnswers
        intake.loadScenario(answers)
      } else {
        const parsed = loadYaml(text) as Record<string, unknown>
        const answers = (parsed.intake_answers ?? {}) as IntakeAnswers
        intake.loadScenario(answers)
      }
      setScreen('assessment')
    }
    reader.readAsText(file)
  }, [intake.loadScenario])

  const handleContinueFullAssessment = useCallback(() => {
    intake.continueFullAssessment()
    setScreen('intake')
  }, [intake.continueFullAssessment])

  const handleSign = async () => {
    const doc = await signing.sign(intake.answers, engine.results)
    setSignedDoc(doc)
    setScreen('document')
  }

  return (
    <div className="app">
      <Header onLoadScenario={handleLoadScenario} onSaveProgress={handleSaveProgress} />
      <Sidebar
        currentSectionIndex={intake.currentSectionIndex}
        isComplete={intake.isComplete}
        results={engine.results}
      />
      <main>
        <ScreenTabs
          active={screen}
          onSelect={setScreen}
          assessmentUnlocked={assessmentUnlocked}
          documentUnlocked={documentUnlocked}
        />
        <div className="screen-content">
          {screen === 'intake' && (
            <IntakeScreen
              intake={intake}
              onComplete={() => setScreen('assessment')}
            />
          )}
          {screen === 'assessment' && (
            <AssessmentScreen
              results={engine.results}
              isEvaluating={engine.isEvaluating}
              onSign={handleSign}
              isSigning={signing.isSigning}
              alreadyReceiving={buildAlreadyReceiving(intake.answers)}
              triageMode={triageMode}
              onContinueFullAssessment={handleContinueFullAssessment}
              answers={intake.answers}
              transitionAnalysis={transition.analysis}
            />
          )}
          {screen === 'document' && signedDoc && (
            <DocumentScreen document={signedDoc} />
          )}
        </div>
      </main>
    </div>
  )
}
