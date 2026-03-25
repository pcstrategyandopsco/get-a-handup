import { createSign } from 'crypto'

// Generate a current week string in YYYY-WW format
export function currentWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `${year}-W${String(week).padStart(2, '0')}`
}

// Sign a document object with the server private key
export function signDocument(document: object): { signature: string; publicKey: string } {
  const signingKey = process.env.SIGNING_KEY

  if (!signingKey) {
    // Development mode: return a mock signature
    console.warn('// SIGNING_KEY not set — using development mock signature')
    const mockSig = Buffer.from(JSON.stringify(document)).toString('base64').slice(0, 64)
    return {
      signature: mockSig,
      publicKey: 'DEV_PUBLIC_KEY_NOT_FOR_PRODUCTION'
    }
  }

  try {
    const sign = createSign('SHA256')
    sign.update(JSON.stringify(document))
    sign.end()
    const signature = sign.sign(signingKey, 'base64')

    // Extract public key from private key for verification
    const { createPublicKey } = require('crypto')
    const publicKeyObj = createPublicKey(signingKey)
    const publicKey = publicKeyObj.export({ type: 'spki', format: 'pem' }) as string

    return { signature, publicKey }
  } catch (err) {
    console.error('Signing error:', err)
    throw new Error('Document signing failed')
  }
}
