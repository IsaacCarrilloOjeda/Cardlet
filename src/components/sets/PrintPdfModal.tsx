'use client'

import { useState } from 'react'
import type { Card } from '@/types'

interface Props {
  setTitle: string
  cards: Card[]
  onClose: () => void
}

type Format = 'cards' | 'sheet'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'flashcards'
}

export function PrintPdfModal({ setTitle, cards, onClose }: Props) {
  const [format, setFormat] = useState<Format>('cards')
  const [showNumbers, setShowNumbers] = useState(true)
  const [showDifficulty, setShowDifficulty] = useState(false)
  const [fontSize, setFontSize] = useState(12)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setIsGenerating(true)
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

      if (format === 'cards') {
        generateCutOutCards(doc, font, fontBold, cards, {
          showNumbers,
          showDifficulty,
          fontSize,
          rgb,
        })
      } else {
        generateStudySheet(doc, font, fontBold, cards, {
          title: setTitle,
          showNumbers,
          showDifficulty,
          fontSize,
          rgb,
        })
      }

      const pdfBytes = await doc.save()
      // pdf-lib returns Uint8Array (compatible with BlobPart in practice, but widen to ArrayBuffer for strict TS).
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slugify(setTitle)}-flashcards.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Export as PDF</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {cards.length} card{cards.length === 1 ? '' : 's'} · downloads to your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Format selector */}
        <div className="flex flex-col gap-2">
          <label
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              format === 'cards'
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--card-border)] hover:border-[var(--accent)]/40'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="cards"
              checked={format === 'cards'}
              onChange={() => setFormat('cards')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-0.5 text-[var(--accent)]">
                <rect x="3" y="3" width="8" height="5" rx="1" />
                <rect x="13" y="3" width="8" height="5" rx="1" />
                <rect x="3" y="10" width="8" height="5" rx="1" />
                <rect x="13" y="10" width="8" height="5" rx="1" />
                <rect x="3" y="17" width="8" height="5" rx="1" />
                <rect x="13" y="17" width="8" height="5" rx="1" />
              </svg>
              <div>
                <p className="font-semibold text-sm">Cut-out cards</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  6 per page (2 × 3). Double-sided print yields matching fronts/backs.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`rounded-xl border p-3 cursor-pointer transition-colors ${
              format === 'sheet'
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--card-border)] hover:border-[var(--accent)]/40'
            }`}
          >
            <input
              type="radio"
              name="format"
              value="sheet"
              checked={format === 'sheet'}
              onChange={() => setFormat('sheet')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-0.5 text-[var(--accent)]">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <line x1="12" y1="3" x2="12" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              <div>
                <p className="font-semibold text-sm">Study sheet</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Two-column table of terms and definitions. Compact.
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Options */}
        <div className="mt-5 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showNumbers}
              onChange={(e) => setShowNumbers(e.target.checked)}
              className="rounded"
            />
            Include card numbers
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showDifficulty}
              onChange={(e) => setShowDifficulty(e.target.checked)}
              className="rounded"
            />
            Include difficulty label
          </label>
          <div className="flex items-center gap-3 text-sm">
            <label htmlFor="print-font-size" className="shrink-0">
              Font size
            </label>
            <input
              id="print-font-size"
              type="range"
              min={9}
              max={18}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-right text-xs tabular-nums text-[var(--muted)]">{fontSize}pt</span>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm hover:border-[var(--foreground)] transition-colors"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || cards.length === 0}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {isGenerating ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- PDF generators ---------- //

type PDFModule = typeof import('pdf-lib')
type PDFDoc = import('pdf-lib').PDFDocument
type PDFFont = import('pdf-lib').PDFFont
type PDFPage = import('pdf-lib').PDFPage

interface CardOpts {
  showNumbers: boolean
  showDifficulty: boolean
  fontSize: number
  rgb: PDFModule['rgb']
}

interface SheetOpts extends CardOpts {
  title: string
}

// Wrap a string into lines that fit within `maxWidth`. No hyphenation —
// long words are broken at the char level only as a last resort.
function wrapLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''

  for (const word of words) {
    const tentative = cur ? `${cur} ${word}` : word
    if (font.widthOfTextAtSize(tentative, fontSize) <= maxWidth) {
      cur = tentative
      continue
    }
    if (cur) {
      lines.push(cur)
      cur = ''
    }
    // Word itself doesn't fit — break by char.
    if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
      let chunk = ''
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, fontSize) > maxWidth) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      cur = chunk
    } else {
      cur = word
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// Strip characters the Helvetica Standard font can't represent (no custom
// subsetting in the Standard 14). Emoji and many non-Latin glyphs fall through
// as "?" via a simple replacement.
function sanitizeForHelvetica(s: string): string {
  // Normalize smart-quote / dash variants that DO have WinAnsi equivalents,
  // then strip anything outside Latin-1 (emoji, CJK, etc.) — the Standard 14
  // Helvetica font pdf-lib embeds can't render codepoints above 0xFF.
  const normalized = s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
  let out = ''
  for (const ch of normalized) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 0x20 && ch !== String.fromCharCode(10) && ch !== String.fromCharCode(9)) continue
    if (code <= 0xff) out += ch
    else out += '?'
  }
  return out
}

// --- cut-out cards ---

function generateCutOutCards(
  doc: PDFDoc,
  font: PDFFont,
  fontBold: PDFFont,
  cards: Card[],
  opts: CardOpts
) {
  // Letter portrait: 612 × 792 pt. 3"×2" card = 216×144 pt. Grid 2×3.
  const PAGE_W = 612
  const PAGE_H = 792
  const CARD_W = 216
  const CARD_H = 144
  const COLS = 2
  const ROWS = 3
  const GRID_W = CARD_W * COLS
  const GRID_H = CARD_H * ROWS
  const MARGIN_X = (PAGE_W - GRID_W) / 2
  const MARGIN_Y = (PAGE_H - GRID_H) / 2

  const borderColor = opts.rgb(0.8, 0.8, 0.8)
  const textColor = opts.rgb(0.1, 0.1, 0.1)
  const metaColor = opts.rgb(0.5, 0.5, 0.5)

  function drawCard(
    page: PDFPage,
    col: number,
    row: number,
    text: string,
    meta: string | null,
    isBack: boolean
  ) {
    const x = MARGIN_X + col * CARD_W
    const y = PAGE_H - MARGIN_Y - (row + 1) * CARD_H

    // Border (cut guideline)
    page.drawRectangle({
      x,
      y,
      width: CARD_W,
      height: CARD_H,
      borderColor,
      borderWidth: 0.5,
    })

    // Body text, centered
    const innerPad = 12
    const innerW = CARD_W - innerPad * 2
    const clean = sanitizeForHelvetica(text)
    const lines = wrapLines(clean, font, opts.fontSize, innerW)
    const lineHeight = opts.fontSize * 1.25
    const blockH = lines.length * lineHeight
    const startY = y + CARD_H / 2 + blockH / 2 - lineHeight

    lines.forEach((line, i) => {
      const w = font.widthOfTextAtSize(line, opts.fontSize)
      page.drawText(line, {
        x: x + (CARD_W - w) / 2,
        y: startY - i * lineHeight,
        size: opts.fontSize,
        font,
        color: textColor,
      })
    })

    // Top-left meta (number, side)
    if (meta) {
      page.drawText(sanitizeForHelvetica(meta), {
        x: x + innerPad,
        y: y + CARD_H - innerPad - 8,
        size: 7.5,
        font: fontBold,
        color: metaColor,
      })
    }

    // Bottom-right side marker
    const sideLabel = isBack ? 'BACK' : 'FRONT'
    const sw = fontBold.widthOfTextAtSize(sideLabel, 6.5)
    page.drawText(sideLabel, {
      x: x + CARD_W - innerPad - sw,
      y: y + innerPad - 2,
      size: 6.5,
      font: fontBold,
      color: metaColor,
    })
  }

  const cardsPerPage = COLS * ROWS
  const pageCount = Math.ceil(cards.length / cardsPerPage)

  for (let p = 0; p < pageCount; p++) {
    const frontPage = doc.addPage([PAGE_W, PAGE_H])
    const backPage = doc.addPage([PAGE_W, PAGE_H])
    const slice = cards.slice(p * cardsPerPage, (p + 1) * cardsPerPage)

    slice.forEach((card, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const num = p * cardsPerPage + i + 1
      const diffLabel = opts.showDifficulty ? `Diff: ${card.difficulty}` : ''
      const numLabel = opts.showNumbers ? `#${num}` : ''
      const meta = [numLabel, diffLabel].filter(Boolean).join('  ')

      drawCard(frontPage, col, row, card.front, meta || null, false)

      // Mirror columns on back so double-sided print aligns fronts to backs.
      const backCol = COLS - 1 - col
      drawCard(backPage, backCol, row, card.back, meta || null, true)
    })
  }
}

// --- study sheet ---

function generateStudySheet(
  doc: PDFDoc,
  font: PDFFont,
  fontBold: PDFFont,
  cards: Card[],
  opts: SheetOpts
) {
  const PAGE_W = 612
  const PAGE_H = 792
  const MARGIN = 54 // 0.75"
  const USABLE_W = PAGE_W - MARGIN * 2
  const COL_1_W = USABLE_W * 0.4
  const COL_2_W = USABLE_W * 0.6
  const PADDING = 6

  const headerColor = opts.rgb(0.15, 0.15, 0.15)
  const bodyColor = opts.rgb(0.1, 0.1, 0.1)
  const metaColor = opts.rgb(0.45, 0.45, 0.45)
  const ruleColor = opts.rgb(0.85, 0.85, 0.85)

  const lineHeight = opts.fontSize * 1.35
  const titleSize = 16
  const headerSize = 10

  let page = doc.addPage([PAGE_W, PAGE_H])
  let cursor = PAGE_H - MARGIN

  // Title
  const cleanTitle = sanitizeForHelvetica(opts.title)
  page.drawText(cleanTitle, {
    x: MARGIN,
    y: cursor - titleSize,
    size: titleSize,
    font: fontBold,
    color: headerColor,
  })
  cursor -= titleSize + 8
  page.drawText(`${cards.length} card${cards.length === 1 ? '' : 's'}`, {
    x: MARGIN,
    y: cursor - headerSize,
    size: headerSize,
    font,
    color: metaColor,
  })
  cursor -= headerSize + 16

  // Table header
  function drawHeader(p: PDFPage, y: number): number {
    p.drawText('TERM', {
      x: MARGIN,
      y: y - headerSize,
      size: headerSize,
      font: fontBold,
      color: metaColor,
    })
    p.drawText('DEFINITION', {
      x: MARGIN + COL_1_W,
      y: y - headerSize,
      size: headerSize,
      font: fontBold,
      color: metaColor,
    })
    const newY = y - headerSize - 6
    p.drawLine({
      start: { x: MARGIN, y: newY },
      end: { x: PAGE_W - MARGIN, y: newY },
      thickness: 0.6,
      color: ruleColor,
    })
    return newY - 10
  }
  cursor = drawHeader(page, cursor)

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    const numPrefix = opts.showNumbers ? `${i + 1}. ` : ''
    const diffSuffix = opts.showDifficulty ? `  (diff ${card.difficulty})` : ''

    const frontText = sanitizeForHelvetica(`${numPrefix}${card.front}${diffSuffix}`)
    const backText = sanitizeForHelvetica(card.back)

    const frontLines = wrapLines(frontText, fontBold, opts.fontSize, COL_1_W - PADDING)
    const backLines = wrapLines(backText, font, opts.fontSize, COL_2_W - PADDING)
    const rowLines = Math.max(frontLines.length, backLines.length)
    const rowH = rowLines * lineHeight + 6

    if (cursor - rowH < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H])
      cursor = PAGE_H - MARGIN
      cursor = drawHeader(page, cursor)
    }

    frontLines.forEach((line, li) => {
      page.drawText(line, {
        x: MARGIN,
        y: cursor - (li + 1) * lineHeight + 4,
        size: opts.fontSize,
        font: fontBold,
        color: bodyColor,
      })
    })
    backLines.forEach((line, li) => {
      page.drawText(line, {
        x: MARGIN + COL_1_W,
        y: cursor - (li + 1) * lineHeight + 4,
        size: opts.fontSize,
        font,
        color: bodyColor,
      })
    })

    cursor -= rowH
    page.drawLine({
      start: { x: MARGIN, y: cursor + 2 },
      end: { x: PAGE_W - MARGIN, y: cursor + 2 },
      thickness: 0.3,
      color: ruleColor,
    })
  }
}
