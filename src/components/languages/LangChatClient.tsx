'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useCredits, TUTOR_HALF_COST, TUTOR_FULL_COST } from '@/components/layout/CreditsContext'
import { bumpLanguageXpAction } from '@/lib/actions'
import { SPEECH_LANG } from './lessonData'

const CONVERSATION_XP = 50

interface Msg { role: 'user' | 'assistant'; content: string }

interface Props {
  langName: string
  langCode: string
  langColor: string
  unitId: string
  unitTitle: string
  unitSubtitle: string
  vocab: { target: string; english: string }[]
}

function speak(text: string, langCode: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = SPEECH_LANG[langCode] ?? 'en-US'
  utter.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

export function LangChatClient({
  langName, langCode, langColor, unitId, unitTitle, unitSubtitle, vocab,
}: Props) {
  const { credits, consumeCredits } = useCredits()
  const [brief, setBrief] = useState(true)
  const [history, setHistory] = useState<Msg[]>([])
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [xpAwarded, setXpAwarded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streaming])

  const turnCost = brief ? TUTOR_HALF_COST : TUTOR_FULL_COST

  async function send(userText: string | null) {
    if (loading) return
    const msgs: Msg[] = userText ? [...history, { role: 'user', content: userText }] : history
    if (!consumeCredits(turnCost)) {
      setError('Out of credits. Top up from /credits.')
      return
    }
    setError(null)
    if (userText) { setHistory(msgs); setInput('') }
    setLoading(true)
    setStreaming('')

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
    try {
      const res = await fetch('/api/ai/lang-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          langName, langCode, unitTitle, unitSubtitle,
          vocab, history: msgs, brief,
        }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) {
              acc += parsed.text
              setStreaming(acc)
            }
          } catch { /* ignore */ }
        }
      }
      if (acc.trim().length === 0) throw new Error('Empty response')
      setHistory((p) => [...p, { role: 'assistant', content: acc }])
      setStreaming('')

      // Award 50 XP the first time the user completes a back-and-forth exchange.
      if (!xpAwarded && msgs.length >= 2) {
        setXpAwarded(true)
        bumpLanguageXpAction(langCode, CONVERSATION_XP, 0).catch(() => {})
      }
    } catch (e) {
      if (reader) { try { await reader.cancel() } catch { /* ignore */ } }
      setError(e instanceof Error ? e.message : 'Chat failed')
      setHistory((p) => [...p, { role: 'assistant', content: '— sorry, I hit a snag. Try again?' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Kick off with an AI opener.
    if (history.length === 0 && !loading) {
      void send(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = input.trim()
    if (!v || loading) return
    void send(v)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Link
            href="/languages"
            className="shrink-0 rounded-full w-9 h-9 flex items-center justify-center border border-[var(--card-border)] hover:bg-[var(--surface)] transition-colors"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: langColor }}>
              {langName} · {unitTitle}
            </p>
            <h1 className="font-black text-base truncate">Practice conversation · {unitSubtitle}</h1>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setBrief((b) => !b)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                background: brief ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--surface)',
                color: brief ? 'var(--accent)' : 'var(--muted)',
                border: `1px solid ${brief ? 'var(--accent)' : 'var(--card-border)'}`,
              }}
              title={brief ? 'Fast mode: short replies, 5 credits each' : 'Full mode: longer replies, 10 credits each'}
            >
              {brief ? '⚡ Fast' : '✨ Full'} · {turnCost}c
            </button>
            <span className="text-xs font-bold text-[var(--muted)]">{credits}c</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-3">
          {history.length === 0 && loading && (
            <p className="text-center text-sm text-[var(--muted)]">Starting conversation…</p>
          )}
          {history.map((m, i) => (
            <MessageBubble key={i} msg={m} langCode={langCode} langColor={langColor} />
          ))}
          {streaming && (
            <MessageBubble msg={{ role: 'assistant', content: streaming }} langCode={langCode} langColor={langColor} streaming />
          )}
          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="sticky bottom-0 border-t border-[var(--card-border)] bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim()) void send(input.trim())
              }
            }}
            placeholder={`Reply in ${langName} (or English)…`}
            rows={1}
            className="flex-1 resize-none rounded-xl bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({
  msg, langCode, langColor, streaming,
}: { msg: Msg; langCode: string; langColor: string; streaming?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--surface)',
          color: isUser ? 'white' : 'var(--foreground)',
          border: isUser ? 'none' : '1px solid var(--card-border)',
        }}
      >
        <p>{msg.content}{streaming && <span className="animate-pulse"> ▍</span>}</p>
        {!isUser && !streaming && msg.content.trim().length > 0 && (
          <button
            onClick={() => speak(msg.content, langCode)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: langColor }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Hear it
          </button>
        )}
      </div>
    </div>
  )
}
