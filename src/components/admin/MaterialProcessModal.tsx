'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { StudyMaterial } from '@/types'

interface SuggestedAction {
  action: 'flashcards' | 'outline' | 'summary' | 'sections'
  label: string
  description: string
  recommended: boolean
}

interface ScanResult {
  text: string
  contentType: 'textbook' | 'notes' | 'exam' | 'equations' | 'reference' | 'general'
  summary: string
  wordCount: number
  suggestedActions: SuggestedAction[]
}

type ExecuteAction = 'flashcards' | 'outline' | 'summary' | 'sections'

interface ExecuteResult {
  type: ExecuteAction
  setId?: string
  cardCount?: number
  content?: string
  sectionCount?: number
  materials?: Array<{ id: string; title: string }>
}

interface Props {
  material: StudyMaterial
  onClose: () => void
}

type Phase = 'extracting' | 'scanning' | 'selecting' | 'executing' | 'done' | 'error'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  textbook: 'Textbook',
  notes: 'Notes',
  exam: 'Exam / Quiz',
  equations: 'Math / Equations',
  reference: 'Reference Material',
  general: 'General Content',
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  textbook: 'bg-blue-500/15 text-blue-400',
  notes: 'bg-yellow-500/15 text-yellow-400',
  exam: 'bg-red-500/15 text-red-400',
  equations: 'bg-purple-500/15 text-purple-400',
  reference: 'bg-green-500/15 text-green-400',
  general: 'bg-[var(--accent)]/15 text-[var(--accent)]',
}

function getMimeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  return map[ext] ?? 'application/octet-stream'
}

function isImageType(mime: string) {
  return mime.startsWith('image/')
}

function isPdfType(mime: string) {
  return mime === 'application/pdf'
}

function isTextType(mime: string) {
  return mime === 'text/plain'
}

async function extractPdfText(file: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(file) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(
      content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' ')
    )
  }
  return pages.join('\n\n').trim()
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function MaterialProcessModal({ material, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('extracting')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [selectedAction, setSelectedAction] = useState<ExecuteAction | null>(null)
  const [cardCount, setCardCount] = useState(20)
  const [executing, setExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null)
  const didRun = useRef(false)

  const mime = getMimeFromFileName(material.file_name)
  const isSupported = isImageType(mime) || isPdfType(mime) || isTextType(mime)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    if (!isSupported) {
      setErrorMsg(
        `${mime} files cannot be scanned automatically. ` +
          'Convert to PDF, PNG, or TXT and re-upload for AI processing.'
      )
      setPhase('error')
      return
    }
    runExtractAndScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runExtractAndScan() {
    setPhase('extracting')
    try {
      const res = await fetch(material.file_url)
      if (!res.ok) throw new Error('Could not fetch file')
      const buffer = await res.arrayBuffer()

      let body: { text?: string; imageBase64?: string; mimeType?: string }

      if (isImageType(mime)) {
        body = { imageBase64: `data:${mime};base64,${toBase64(buffer)}`, mimeType: mime }
      } else if (isPdfType(mime)) {
        let text: string
        try {
          text = await extractPdfText(buffer)
        } catch {
          // PDF has no selectable text (scanned) — send as image for vision OCR
          body = {
            imageBase64: `data:application/pdf;base64,${toBase64(buffer)}`,
            mimeType: 'application/pdf',
          }
          text = ''
        }
        if (text.trim().length > 50) {
          body = { text }
        } else {
          body = {
            imageBase64: `data:application/pdf;base64,${toBase64(buffer)}`,
            mimeType: 'application/pdf',
          }
        }
      } else {
        // text/plain
        body = { text: new TextDecoder().decode(buffer) }
      }

      setPhase('scanning')

      const scanRes = await fetch('/api/ai/scan-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const scanData = await scanRes.json()
      if (!scanRes.ok) throw new Error(scanData.error ?? 'Scan failed')

      setScanResult(scanData as ScanResult)
      // Pre-select the recommended action
      const recommended = (scanData as ScanResult).suggestedActions.find(
        (a: SuggestedAction) => a.recommended
      )
      if (recommended) setSelectedAction(recommended.action)
      setPhase('selecting')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process file')
      setPhase('error')
    }
  }

  async function runExecute() {
    if (!scanResult || !selectedAction) return
    setExecuting(true)
    setPhase('executing')
    try {
      const res = await fetch('/api/ai/execute-material-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scanResult.text,
          action: selectedAction,
          title: material.title,
          subject: material.subject,
          count: cardCount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Execution failed')
      setExecuteResult(data as ExecuteResult)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Execution failed')
      setPhase('error')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={phase === 'executing' ? undefined : onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="relative w-full max-w-xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
            <div>
              <p className="font-bold">AI Document Processing</p>
              <p className="text-[11px] text-[var(--muted)] truncate max-w-[320px]">{material.title}</p>
            </div>
            {phase !== 'executing' && (
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[var(--surface)]">
            <motion.div
              className="h-full bg-[var(--accent)]"
              initial={{ width: '0%' }}
              animate={{
                width:
                  phase === 'extracting' ? '20%'
                  : phase === 'scanning' ? '50%'
                  : phase === 'selecting' ? '65%'
                  : phase === 'executing' ? '85%'
                  : phase === 'done' ? '100%'
                  : '0%',
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          <div className="p-5 min-h-[280px] flex flex-col">
            {/* PHASE: extracting */}
            {(phase === 'extracting' || phase === 'scanning') && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm">
                    {phase === 'extracting' ? 'Reading your file…' : 'AI scanning content…'}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {phase === 'extracting'
                      ? 'Extracting text from document'
                      : 'Classifying content and identifying structure'}
                  </p>
                </div>
                {/* Step indicators */}
                <div className="flex items-center gap-3 text-[11px]">
                  {[
                    { label: 'Read file', done: phase !== 'extracting' },
                    { label: 'Scan content', done: false },
                    { label: 'Choose action', done: false },
                    { label: 'Execute', done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          step.done
                            ? 'bg-green-500/20 text-green-400'
                            : i === (phase === 'extracting' ? 0 : 1)
                            ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                            : 'bg-[var(--surface)] text-[var(--muted)]'
                        }`}
                      >
                        {step.done ? '✓' : i + 1}
                      </span>
                      <span
                        className={
                          step.done
                            ? 'text-green-400'
                            : i === (phase === 'extracting' ? 0 : 1)
                            ? 'text-[var(--foreground)]'
                            : 'text-[var(--muted)]'
                        }
                      >
                        {step.label}
                      </span>
                      {i < 3 && <span className="text-[var(--card-border)]">›</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE: selecting */}
            {phase === 'selecting' && scanResult && (
              <div className="flex flex-col gap-4">
                {/* Content analysis result */}
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold">Content scanned</p>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        CONTENT_TYPE_COLORS[scanResult.contentType] ?? CONTENT_TYPE_COLORS.general
                      }`}
                    >
                      {CONTENT_TYPE_LABELS[scanResult.contentType] ?? scanResult.contentType}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{scanResult.summary}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-2">≈ {scanResult.wordCount.toLocaleString()} words extracted</p>
                </div>

                {/* Action picker */}
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    Choose what AI 2 should create:
                  </p>
                  <div className="flex flex-col gap-2">
                    {scanResult.suggestedActions.map((a) => (
                      <button
                        key={a.action}
                        onClick={() => setSelectedAction(a.action)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selectedAction === a.action
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                            : 'border-[var(--card-border)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        <span className="text-lg">
                          {a.action === 'flashcards' ? '🃏' : a.action === 'summary' ? '📝' : a.action === 'outline' ? '📋' : '✂️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{a.label}</p>
                            {a.recommended && (
                              <span className="rounded-full bg-[var(--accent)]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--accent)]">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted)]">{a.description}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                            selectedAction === a.action
                              ? 'border-[var(--accent)] bg-[var(--accent)]'
                              : 'border-[var(--card-border)]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card count slider (only for flashcards) */}
                {selectedAction === 'flashcards' && (
                  <div className="rounded-xl border border-[var(--card-border)] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">Number of flashcards</p>
                      <span className="text-sm font-bold text-[var(--accent)]">{cardCount}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={cardCount}
                      onChange={(e) => setCardCount(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                      <span>5</span>
                      <span>50</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={runExecute}
                  disabled={!selectedAction}
                  className="rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                  Run AI 2 →
                </button>
              </div>
            )}

            {/* PHASE: executing */}
            {phase === 'executing' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm">AI 2 is working…</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {selectedAction === 'flashcards'
                      ? `Generating ${cardCount} flashcards and creating study set`
                      : selectedAction === 'summary'
                      ? 'Writing a comprehensive summary'
                      : selectedAction === 'outline'
                      ? 'Building a structured outline'
                      : 'Splitting content into sections'}
                  </p>
                </div>
              </div>
            )}

            {/* PHASE: done */}
            {phase === 'done' && executeResult && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold">Done!</p>
                    <p className="text-xs text-[var(--muted)]">
                      {executeResult.type === 'flashcards' &&
                        `Created ${executeResult.cardCount} flashcards in a new study set`}
                      {executeResult.type === 'summary' && 'Summary generated'}
                      {executeResult.type === 'outline' && 'Outline generated'}
                      {executeResult.type === 'sections' &&
                        `Split into ${executeResult.sectionCount} sections, each saved as a material`}
                    </p>
                  </div>
                </div>

                {/* Flashcard set link */}
                {executeResult.type === 'flashcards' && executeResult.setId && (
                  <Link
                    href={`/sets/${executeResult.setId}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                  >
                    <span>View {executeResult.cardCount}-card study set →</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                )}

                {/* Text content preview (summary / outline) */}
                {(executeResult.type === 'summary' || executeResult.type === 'outline') &&
                  executeResult.content && (
                    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-mono leading-relaxed">
                        {executeResult.content}
                      </pre>
                    </div>
                  )}

                {/* Section links */}
                {executeResult.type === 'sections' && executeResult.materials && (
                  <div className="flex flex-col gap-1.5">
                    {executeResult.materials.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs text-[var(--foreground)]"
                      >
                        📄 {m.title}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="rounded-xl border border-[var(--card-border)] py-2.5 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* PHASE: error */}
            {phase === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Processing failed</p>
                  <p className="text-xs text-[var(--muted)]">{errorMsg}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
