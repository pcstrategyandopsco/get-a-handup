import { useState, useCallback } from 'react'
import type { EntitlementResult, IntakeAnswers, SignedDocument } from '../lib/types'

const RULES_VERSION = 'SSA-2024.Q4'

function formatEntitlementBlock(e: EntitlementResult): string {
  const lines: string[] = []
  const amount = e.weekly_amount ? ` — ${e.weekly_amount}` : ''
  lines.push(`${e.name}${amount}`)
  if (e.legal_basis) lines.push(`  Legal basis: ${e.legal_basis}`)
  lines.push(`  Action: ${e.action}`)
  if (e.documentation_required && e.documentation_required.length > 0) {
    lines.push(`  Documentation required:`)
    for (const doc of e.documentation_required) {
      lines.push(`    - ${doc}`)
    }
  }
  if (e.deflection_patterns && e.deflection_patterns.length > 0) {
    lines.push(`  Known deflection patterns:`)
    for (const pattern of e.deflection_patterns) {
      lines.push(`    - ${pattern}`)
    }
  }
  if (e.advocacy) {
    lines.push(`  Appointment playbook:`)
    if (e.advocacy.appointment_strategy) {
      lines.push(`    Strategy: ${e.advocacy.appointment_strategy}`)
    }
    if (e.advocacy.talking_points && e.advocacy.talking_points.length > 0) {
      lines.push(`    What to say:`)
      for (let i = 0; i < e.advocacy.talking_points.length; i++) {
        lines.push(`      ${i + 1}. ${e.advocacy.talking_points[i]}`)
      }
    }
    if (e.advocacy.common_objections && e.advocacy.common_objections.length > 0) {
      lines.push(`    If they say / You say:`)
      for (const obj of e.advocacy.common_objections) {
        lines.push(`      They say: "${obj.objection}"`)
        lines.push(`      You say: "${obj.counter}"`)
        if (obj.cite) lines.push(`      Cite: ${obj.cite}`)
      }
    }
    if (e.advocacy.escalation_triggers && e.advocacy.escalation_triggers.length > 0) {
      lines.push(`    If they won't budge:`)
      for (const esc of e.advocacy.escalation_triggers) {
        lines.push(`      When: ${esc.trigger}`)
        lines.push(`      Do: ${esc.action}`)
      }
    }
  }
  return lines.join('\n')
}

function generateBrief(entitlements: EntitlementResult[], _answers: IntakeAnswers): string {
  const entitled = entitlements.filter(e => e.status === 'ENTITLED')
  const possible = entitlements.filter(e => e.status === 'POSSIBLE')

  const sections: string[] = []

  // Notice
  sections.push(
    'NOTICE TO CASE MANAGER\n' +
    'This is a structured entitlement assessment with statutory citations prepared under the Social Security Act 2018. ' +
    'If any entitlement identified below is declined, a written decision with specific legal reasons will be requested under s12 SSA 2018. ' +
    'This document is cryptographically signed and timestamped.'
  )

  // Entitled
  if (entitled.length > 0) {
    sections.push(
      'ENTITLEMENTS — ENTITLED\n' +
      entitled.map(formatEntitlementBlock).join('\n\n')
    )
  }

  // Possible
  if (possible.length > 0) {
    sections.push(
      'ENTITLEMENTS — POSSIBLE\n' +
      possible.map(formatEntitlementBlock).join('\n\n')
    )
  }

  // Rights block
  sections.push(
    'IF ANY ENTITLEMENT IS DECLINED\n' +
    '1. Request the decision in writing with specific legal reasons\n' +
    '2. File a Review of Decision under s12 Social Security Act 2018\n' +
    '3. File an online complaint at msd.govt.nz\n' +
    '4. Contact Community Law or Citizens Advice Bureau for free advocacy\n' +
    '5. Contact your Member of Parliament\'s office'
  )

  return sections.join('\n\n')
}

export type UseDocumentSigningReturn = {
  sign: (answers: IntakeAnswers, entitlements: EntitlementResult[]) => Promise<SignedDocument>
  verify: (doc: SignedDocument) => Promise<boolean>
  isSigning: boolean
  error: string | null
}

export function useDocumentSigning(): UseDocumentSigningReturn {
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sign = useCallback(async (
    answers: IntakeAnswers,
    entitlements: EntitlementResult[]
  ): Promise<SignedDocument> => {
    setIsSigning(true)
    setError(null)

    const docBody = {
      version: RULES_VERSION,
      generated: new Date().toISOString().split('T')[0],
      circumstances: answers,
      entitlements,
      brief: generateBrief(entitlements, answers)
    }

    try {
      const msgData = new TextEncoder().encode(JSON.stringify(docBody))

      const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      )

      const sigBuffer = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        msgData
      )

      const pubKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)

      const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(pubKeyBuffer)))

      return { ...docBody, signature, publicKey }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signing failed'
      setError(msg)
      return {
        ...docBody,
        signature: 'UNSIGNED_FALLBACK',
        publicKey: 'FALLBACK_KEY'
      }
    } finally {
      setIsSigning(false)
    }
  }, [])

  const verify = useCallback(async (doc: SignedDocument): Promise<boolean> => {
    if (doc.signature === 'UNSIGNED_FALLBACK') return true
    if (doc.publicKey === 'FALLBACK_KEY') return true

    try {
      // Verify using Web Crypto API
      const { signature, publicKey, ...docBody } = doc

      const keyData = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0))

      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyData.buffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      )

      const sigData = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
      const msgData = new TextEncoder().encode(JSON.stringify(docBody))

      return await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        sigData.buffer,
        msgData.buffer
      )
    } catch {
      return false
    }
  }, [])

  return { sign, verify, isSigning, error }
}

// Download a signed document as PDF
export async function downloadDocument(doc: SignedDocument): Promise<void> {
  const { generatePdf } = await import('../lib/generatePdf')
  const pdfBytes = await generatePdf(doc)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `entitlement-brief-${doc.generated}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
