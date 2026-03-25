import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import type { SignedDocument, EntitlementResult } from './types'

// ── Layout constants ──
const PAGE_W = 595.28  // A4
const PAGE_H = 841.89
const MARGIN_L = 50
const MARGIN_R = 50
const MARGIN_T = 60
const MARGIN_B = 56     // room for page number
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
const USABLE_H = PAGE_H - MARGIN_T - MARGIN_B

// Font sizes
const SIZE_TITLE = 15
const SIZE_SECTION = 11
const SIZE_ENT_NAME = 10.5
const SIZE_BODY = 9.5
const SIZE_SMALL = 8.5
const SIZE_FOOTER = 7.5

// Line heights
const LH_TITLE = 20
const LH_SECTION = 16
const LH_BODY = 13.5
const LH_SMALL = 11.5

// Colours
const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.45, 0.45, 0.45)
const DARK = rgb(0.12, 0.12, 0.12)
const RULE_COLOR = rgb(0.78, 0.78, 0.78)
const ACCENT = rgb(0.25, 0.25, 0.25)
const BOX_BG = rgb(0.96, 0.96, 0.96)
const BOX_BORDER = rgb(0.7, 0.7, 0.7)
const ENT_ACCENT = rgb(0.82, 0.65, 0.18)    // gold
const POSS_ACCENT = rgb(0.22, 0.62, 0.68)   // teal
const WARN_ACCENT = rgb(0.75, 0.28, 0.28)   // red

// Padding inside boxes
const BOX_PAD = 12

const CIRCUMSTANCE_LABELS: Record<string, string> = {
  'personal.age': 'Age',
  'personal.residency': 'Residency',
  'personal.years_in_nz': 'Years in NZ',
  'personal.relationship': 'Relationship',
  'personal.partner_income': 'Partner weekly income',
  'housing.type': 'Housing',
  'housing.cost': 'Weekly housing cost',
  'housing.region': 'Region',
  'housing.social_housing': 'Social housing',
  'housing.arrears': 'Rent arrears',
  'housing.need_to_move': 'Needs to move',
  'income.employed': 'Employed',
  'income.hours': 'Weekly hours',
  'income.amount': 'Weekly income',
  'income.benefit': 'On benefit',
  'income.benefit_type': 'Benefit type',
  'income.assets': 'Assets',
  'health.condition': 'Health condition',
  'health.duration': 'Condition duration',
  'health.costs': 'Health-related costs',
  'health.hours_able': 'Work capacity',
  'children.dependent': 'Dependent children',
  'children.count': 'Number of children',
  'children.ages': 'Child ages',
  'education.studying': 'Studying',
  'education.level': 'Study level',
  'education.load': 'Study load',
  'situation.emergency': 'Emergency',
  'situation.family_violence': 'Family violence',
  'situation.recently_released': 'Recently released',
  'situation.refugee': 'Refugee/protected person',
  'situation.carer': 'Full-time carer',
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined || value === '') return '\u2014'
  return String(value)
}

/** Word-wrap text to fit within maxWidth. Returns array of lines. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (para.trim() === '') { lines.push(''); continue }
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

/** Measure how many vertical points a wrapped text block will consume. */
function measureText(text: string, font: PDFFont, size: number, maxWidth: number, lineHeight: number): number {
  return wrapText(text, font, size, maxWidth).length * lineHeight
}

// ── Deferred drawing operations ──
// We collect ops into blocks, measure them, then commit to pages.

type DrawOp =
  | { type: 'text'; text: string; font: PDFFont; size: number; color: ReturnType<typeof rgb>; x: number; maxWidth: number; lineHeight: number }
  | { type: 'gap'; pts: number }
  | { type: 'rule'; thickness?: number; color?: ReturnType<typeof rgb>; indent?: number }
  | { type: 'rect'; x: number; width: number; height: number; color: ReturnType<typeof rgb>; borderColor?: ReturnType<typeof rgb>; borderWidth?: number }
  | { type: 'leftBorder'; color: ReturnType<typeof rgb>; height: number; x: number }

/** Measure the total height of a sequence of draw ops. */
function measureOps(ops: DrawOp[]): number {
  let h = 0
  for (const op of ops) {
    switch (op.type) {
      case 'text': h += wrapText(op.text, op.font, op.size, op.maxWidth).length * op.lineHeight; break
      case 'gap': h += op.pts; break
      case 'rule': h += 8; break
      case 'rect': break  // rects are positioned absolutely relative to block start
      case 'leftBorder': break
    }
  }
  return h
}

class PdfBuilder {
  private doc: PDFDocument
  private page!: PDFPage
  private y: number = 0
  private font: PDFFont
  private fontBold: PDFFont
  private fontOblique: PDFFont
  private pageNum: number = 0
  private title: string = ''
  private generated: string = ''

  constructor(doc: PDFDocument, font: PDFFont, fontBold: PDFFont, fontOblique: PDFFont) {
    this.doc = doc
    this.font = font
    this.fontBold = fontBold
    this.fontOblique = fontOblique
  }

  setDocMeta(title: string, generated: string): void {
    this.title = title
    this.generated = generated
  }

  get spaceLeft(): number { return this.y - MARGIN_B }

  addPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H])
    this.y = PAGE_H - MARGIN_T
    this.pageNum++

    // Running header on pages 2+
    if (this.pageNum > 1) {
      this.page.drawText(this.title, {
        x: MARGIN_L, y: PAGE_H - 30,
        size: SIZE_SMALL, font: this.font, color: GREY,
      })
      this.page.drawText(this.generated, {
        x: PAGE_W - MARGIN_R - this.font.widthOfTextAtSize(this.generated, SIZE_SMALL),
        y: PAGE_H - 30,
        size: SIZE_SMALL, font: this.font, color: GREY,
      })
      this.page.drawLine({
        start: { x: MARGIN_L, y: PAGE_H - 38 },
        end: { x: PAGE_W - MARGIN_R, y: PAGE_H - 38 },
        thickness: 0.4, color: RULE_COLOR,
      })
      this.y = PAGE_H - MARGIN_T - 4  // slightly lower to clear header
    }
  }

  /** Write page numbers on all pages. Call once at the end. */
  writePageNumbers(): void {
    const pages = this.doc.getPages()
    const total = pages.length
    for (let i = 0; i < total; i++) {
      const pg = pages[i]
      const label = `${i + 1} / ${total}`
      const w = this.font.widthOfTextAtSize(label, SIZE_FOOTER)
      pg.drawText(label, {
        x: (PAGE_W - w) / 2, y: MARGIN_B - 20,
        size: SIZE_FOOTER, font: this.font, color: GREY,
      })
    }
  }

  /** Ensure space, or start new page. Returns true if a new page was created. */
  ensureSpace(needed: number): boolean {
    if (this.y - needed < MARGIN_B) {
      this.addPage()
      return true
    }
    return false
  }

  // ── Primitive drawing ──

  drawTextDirect(text: string, opts: {
    font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>
    x?: number; maxWidth?: number; lineHeight?: number
  } = {}): void {
    const f = opts.font ?? this.font
    const size = opts.size ?? SIZE_BODY
    const color = opts.color ?? DARK
    const x = opts.x ?? MARGIN_L
    const maxWidth = opts.maxWidth ?? CONTENT_W
    const lh = opts.lineHeight ?? LH_BODY

    const lines = wrapText(text, f, size, maxWidth)
    for (const line of lines) {
      this.ensureSpace(lh)
      this.page.drawText(line, { x, y: this.y, size, font: f, color })
      this.y -= lh
    }
  }

  drawRule(thickness = 0.5, color = RULE_COLOR, indent = 0): void {
    this.ensureSpace(8)
    this.page.drawLine({
      start: { x: MARGIN_L + indent, y: this.y },
      end: { x: PAGE_W - MARGIN_R, y: this.y },
      thickness, color,
    })
    this.y -= 8
  }

  gap(pts: number): void { this.y -= pts }

  // ── Block-level: measure then place ──

  /**
   * Place a block of ops. If the block fits on the current page, draw it.
   * If not and it fits on a fresh page, break first. If it's taller than
   * a full page, just flow it (line-level breaks will handle it).
   */
  placeBlock(ops: DrawOp[]): void {
    const h = measureOps(ops)
    if (h <= USABLE_H && this.spaceLeft < h) {
      this.addPage()
    }
    this.commitOps(ops)
  }

  /** Draw ops starting from current y, with line-level page breaks. */
  private commitOps(ops: DrawOp[]): void {
    // First pass: find any rect/leftBorder ops and note the block start y
    const blockStartY = this.y
    const deferred: Array<{ op: DrawOp; startY: number }> = []

    for (const op of ops) {
      switch (op.type) {
        case 'text': {
          const lines = wrapText(op.text, op.font, op.size, op.maxWidth)
          for (const line of lines) {
            this.ensureSpace(op.lineHeight)
            this.page.drawText(line, { x: op.x, y: this.y, size: op.size, font: op.font, color: op.color })
            this.y -= op.lineHeight
          }
          break
        }
        case 'gap':
          this.y -= op.pts
          break
        case 'rule':
          this.drawRule(op.thickness, op.color, op.indent)
          break
        case 'rect':
          // Draw rect at current position (background for next content)
          this.page.drawRectangle({
            x: op.x, y: this.y - op.height,
            width: op.width, height: op.height,
            color: op.color,
            borderColor: op.borderColor, borderWidth: op.borderWidth,
          })
          break
        case 'leftBorder':
          // Deferred: draw after we know the final y
          deferred.push({ op, startY: this.y })
          break
      }
    }

    // Draw deferred left borders
    for (const { op, startY } of deferred) {
      if (op.type === 'leftBorder') {
        const endY = this.y
        if (startY > endY) {
          this.page.drawLine({
            start: { x: op.x, y: startY + 4 },
            end: { x: op.x, y: endY },
            thickness: 2.5, color: op.color,
          })
        }
      }
    }
  }

  // ── High-level section builders ──

  sectionTitle(text: string, bgColor?: ReturnType<typeof rgb>): void {
    const barH = LH_SECTION + 10
    this.ensureSpace(barH + 8)
    this.gap(10)

    const bg = bgColor ?? rgb(0.92, 0.92, 0.92)
    this.page.drawRectangle({
      x: MARGIN_L, y: this.y - barH + LH_SECTION + 2,
      width: CONTENT_W, height: barH,
      color: bg,
    })
    this.page.drawText(text, {
      x: MARGIN_L + 10, y: this.y,
      size: SIZE_SECTION, font: this.fontBold, color: ACCENT,
    })
    this.y -= barH - LH_SECTION + 2
    this.gap(6)
  }

  /** Notice box with border and background. */
  noticeBox(paragraphs: string[]): void {
    // Measure content height
    let contentH = 0
    for (const p of paragraphs) {
      contentH += measureText(p, this.font, SIZE_BODY, CONTENT_W - BOX_PAD * 2, LH_BODY)
      contentH += 4  // inter-paragraph gap
    }
    const boxH = contentH + BOX_PAD * 2

    this.ensureSpace(boxH + 8)

    // Draw box background + border
    this.page.drawRectangle({
      x: MARGIN_L, y: this.y - boxH,
      width: CONTENT_W, height: boxH,
      color: BOX_BG,
      borderColor: BOX_BORDER, borderWidth: 0.8,
    })

    // Draw content inside box
    this.y -= BOX_PAD
    for (let i = 0; i < paragraphs.length; i++) {
      this.drawTextDirect(paragraphs[i], {
        x: MARGIN_L + BOX_PAD, maxWidth: CONTENT_W - BOX_PAD * 2,
        size: SIZE_BODY, color: DARK,
      })
      if (i < paragraphs.length - 1) this.gap(4)
    }
    this.y -= BOX_PAD
    this.gap(4)
  }

  /** Two-column circumstances grid. */
  circumstancesGrid(items: Array<{ label: string; value: string }>): void {
    const colW = (CONTENT_W - 16) / 2
    const labelW = 120
    const valW = colW - labelW - 8

    // Process in pairs
    for (let i = 0; i < items.length; i += 2) {
      const left = items[i]
      const right = items[i + 1]

      // Measure heights for both columns to align row
      const leftLines = Math.max(1, wrapText(left.value, this.font, SIZE_BODY, valW).length)
      const rightLines = right ? Math.max(1, wrapText(right.value, this.font, SIZE_BODY, valW).length) : 0
      const rowH = Math.max(leftLines, rightLines) * LH_BODY + 2

      this.ensureSpace(rowH)

      // Alternating row background
      if ((i / 2) % 2 === 0) {
        this.page.drawRectangle({
          x: MARGIN_L, y: this.y - rowH + LH_BODY - 2,
          width: CONTENT_W, height: rowH,
          color: rgb(0.97, 0.97, 0.97),
        })
      }

      // Left column
      const x1 = MARGIN_L + 6
      this.page.drawText(left.label, { x: x1, y: this.y, size: SIZE_SMALL, font: this.font, color: GREY })
      const leftValLines = wrapText(left.value, this.font, SIZE_BODY, valW)
      for (let j = 0; j < leftValLines.length; j++) {
        this.page.drawText(leftValLines[j], { x: x1 + labelW, y: this.y - j * LH_BODY, size: SIZE_BODY, font: this.font, color: DARK })
      }

      // Right column
      if (right) {
        const x2 = MARGIN_L + colW + 16
        this.page.drawText(right.label, { x: x2, y: this.y, size: SIZE_SMALL, font: this.font, color: GREY })
        const rightValLines = wrapText(right.value, this.font, SIZE_BODY, valW)
        for (let j = 0; j < rightValLines.length; j++) {
          this.page.drawText(rightValLines[j], { x: x2 + labelW, y: this.y - j * LH_BODY, size: SIZE_BODY, font: this.font, color: DARK })
        }
      }

      this.y -= rowH
    }
  }

  /** Build ops for one entitlement, measure, and place as a block. */
  entitlementBlock(e: EntitlementResult, accentColor: ReturnType<typeof rgb>): void {
    const indent = 10
    const innerW = CONTENT_W - indent

    const ops: DrawOp[] = []
    ops.push({ type: 'leftBorder', color: accentColor, height: 0, x: MARGIN_L })
    ops.push({ type: 'gap', pts: 2 })

    // Name + amount on same conceptual line
    const nameText = e.weekly_amount ? `${e.name}  \u2014  ${e.weekly_amount}` : e.name
    ops.push({ type: 'text', text: nameText, font: this.fontBold, size: SIZE_ENT_NAME, color: BLACK, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_BODY })

    if (e.legal_basis) {
      ops.push({ type: 'text', text: e.legal_basis, font: this.fontOblique, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
    }

    ops.push({ type: 'gap', pts: 3 })
    ops.push({ type: 'text', text: e.action, font: this.font, size: SIZE_BODY, color: DARK, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_BODY })

    if (e.documentation_required && e.documentation_required.length > 0) {
      ops.push({ type: 'gap', pts: 4 })
      ops.push({ type: 'text', text: 'Bring:', font: this.fontBold, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
      for (const d of e.documentation_required) {
        ops.push({ type: 'text', text: `\u2022  ${d}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
      }
    }

    if (e.deflection_patterns && e.deflection_patterns.length > 0) {
      ops.push({ type: 'gap', pts: 4 })
      ops.push({ type: 'text', text: 'Watch for:', font: this.fontBold, size: SIZE_SMALL, color: WARN_ACCENT, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
      for (const p of e.deflection_patterns) {
        ops.push({ type: 'text', text: `!  ${p}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
      }
    }

    if (e.advocacy) {
      if (e.advocacy.appointment_strategy) {
        ops.push({ type: 'gap', pts: 4 })
        ops.push({ type: 'text', text: `Strategy: ${e.advocacy.appointment_strategy}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
      }
      if (e.advocacy.talking_points && e.advocacy.talking_points.length > 0) {
        ops.push({ type: 'gap', pts: 3 })
        ops.push({ type: 'text', text: 'What to say:', font: this.fontBold, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
        e.advocacy.talking_points.forEach((tp, i) => {
          ops.push({ type: 'text', text: `${i + 1}.  ${tp}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
        })
      }
      if (e.advocacy.common_objections && e.advocacy.common_objections.length > 0) {
        ops.push({ type: 'gap', pts: 3 })
        ops.push({ type: 'text', text: 'If they say / You say:', font: this.fontBold, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
        for (const obj of e.advocacy.common_objections) {
          ops.push({ type: 'text', text: `They say: "${obj.objection}"`, font: this.fontOblique, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
          ops.push({ type: 'text', text: `You say: "${obj.counter}"`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
          if (obj.cite) {
            ops.push({ type: 'text', text: `Cite: ${obj.cite}`, font: this.fontOblique, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
          }
        }
      }
      if (e.advocacy.escalation_triggers && e.advocacy.escalation_triggers.length > 0) {
        ops.push({ type: 'gap', pts: 3 })
        ops.push({ type: 'text', text: "If they won't budge:", font: this.fontBold, size: SIZE_SMALL, color: GREY, x: MARGIN_L + indent, maxWidth: innerW, lineHeight: LH_SMALL })
        for (const esc of e.advocacy.escalation_triggers) {
          ops.push({ type: 'text', text: `When: ${esc.trigger}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
          ops.push({ type: 'text', text: `Do: ${esc.action}`, font: this.font, size: SIZE_SMALL, color: DARK, x: MARGIN_L + indent + 8, maxWidth: innerW - 8, lineHeight: LH_SMALL })
        }
      }
    }

    ops.push({ type: 'gap', pts: 10 })

    this.placeBlock(ops)
  }

  /** Rights block — kept together on one page if possible. */
  rightsBlock(rights: string[]): void {
    const ops: DrawOp[] = []
    for (let i = 0; i < rights.length; i++) {
      ops.push({ type: 'text', text: `${i + 1}.  ${rights[i]}`, font: this.font, size: SIZE_BODY, color: DARK, x: MARGIN_L + 6, maxWidth: CONTENT_W - 6, lineHeight: LH_BODY + 2 })
    }
    this.placeBlock(ops)
  }
}

export async function generatePdf(doc: SignedDocument): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const b = new PdfBuilder(pdfDoc, font, fontBold, fontOblique)
  b.setDocMeta('Entitlement Assessment \u2014 Appointment Brief', doc.generated)
  b.addPage()

  // ── Title block ──
  b.drawTextDirect('ENTITLEMENT ASSESSMENT', { font: fontBold, size: SIZE_TITLE, color: BLACK, lineHeight: LH_TITLE })
  b.drawTextDirect('APPOINTMENT BRIEF', { font: fontBold, size: SIZE_TITLE, color: BLACK, lineHeight: LH_TITLE })
  b.gap(6)
  b.drawTextDirect(`Version: ${doc.version}     Generated: ${doc.generated}`, { size: SIZE_BODY, color: GREY })
  b.drawRule(1.2, rgb(0.3, 0.3, 0.3))
  b.gap(4)

  // ── Notice to case manager (boxed) ──
  b.drawTextDirect('NOTICE TO CASE MANAGER', { font: fontBold, size: SIZE_SECTION, color: ACCENT, lineHeight: LH_SECTION })
  b.gap(4)
  b.noticeBox([
    'This is a structured entitlement assessment with statutory citations prepared under the Social Security Act 2018. The person presenting this document has identified potential entitlements based on their circumstances.',
    'If any entitlement identified below is declined, a written decision with specific legal reasons will be requested under s12 SSA 2018.',
    'This document is cryptographically signed and timestamped.',
  ])
  b.gap(4)

  // ── Circumstances ──
  const circumstances = Object.entries(doc.circumstances)
    .filter(([key]) => key in CIRCUMSTANCE_LABELS)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({ label: CIRCUMSTANCE_LABELS[key], value: formatValue(value) }))

  if (circumstances.length > 0) {
    b.sectionTitle('CIRCUMSTANCES')
    b.circumstancesGrid(circumstances)
    b.gap(8)
  }

  // ── Entitlements — Entitled ──
  const entitled = doc.entitlements.filter(e => e.status === 'ENTITLED')
  const possible = doc.entitlements.filter(e => e.status === 'POSSIBLE')

  if (entitled.length > 0) {
    b.sectionTitle(`ENTITLEMENTS \u2014 ENTITLED  (${entitled.length})`, rgb(0.97, 0.94, 0.86))
    for (const e of entitled) {
      b.entitlementBlock(e, ENT_ACCENT)
    }
  }

  // ── Entitlements — Possible ──
  if (possible.length > 0) {
    b.sectionTitle(`ENTITLEMENTS \u2014 WORTH INVESTIGATING  (${possible.length})`, rgb(0.87, 0.95, 0.96))
    for (const e of possible) {
      b.entitlementBlock(e, POSS_ACCENT)
    }
  }

  // ── Rights block ──
  b.sectionTitle('IF ANY ENTITLEMENT IS DECLINED')
  b.rightsBlock([
    'Request the decision in writing with specific legal reasons',
    'File a Review of Decision under s12 Social Security Act 2018',
    'File an online complaint at msd.govt.nz',
    'Contact Community Law or Citizens Advice Bureau for free advocacy',
    "Contact your Member of Parliament's office",
  ])
  b.gap(8)

  // ── Legal references ──
  const legalRefs = [...new Set(
    doc.entitlements
      .map(e => e.legal_basis)
      .filter((basis): basis is string => !!basis && basis.length > 0)
  )]

  if (legalRefs.length > 0) {
    b.sectionTitle('LEGAL REFERENCES')
    for (const ref of legalRefs) {
      b.drawTextDirect(`\u2022  ${ref}`, { size: SIZE_SMALL, color: DARK, lineHeight: LH_SMALL })
    }
    b.gap(8)
  }

  // ── Signature ──
  b.drawRule(1, rgb(0.4, 0.4, 0.4))
  b.gap(4)
  b.drawTextDirect(`SIGNATURE: ${doc.signature.slice(0, 64)}...`, { size: SIZE_SMALL, font: font, color: GREY, lineHeight: LH_SMALL })
  b.gap(20)

  // Page numbers on all pages
  b.writePageNumbers()

  return pdfDoc.save()
}
