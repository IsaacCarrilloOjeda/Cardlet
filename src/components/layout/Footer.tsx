'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitFeedbackAction } from '@/lib/actions'

type ModalType = 'bug' | 'feature' | null

export function Footer() {
  const [modal, setModal] = useState<ModalType>(null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !modal) return
    setLoading(true)
    try {
      await submitFeedbackAction(modal, text.trim())
      setSent(true)
      setTimeout(() => { setSent(false); setModal(null); setText('') }, 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Unauthorized' || msg.toLowerCase().includes('auth')) {
        setNeedsLogin(true)
      }
    } finally {
      setLoading(false)
    }
  }

  function closeModal() { setModal(null); setText(''); setSent(false); setNeedsLogin(false) }

  return (
    <>
      <footer className="border-t border-[var(--card-border)] bg-[var(--background)] py-4 px-4 mt-auto">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} Cardlet · AI-powered flashcards · Built by{' '}
            <a href="https://kynesystems.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">KYNE Systems</a>
            {' · '}
            <a href="https://github.com/IsaacCarrilloOjeda/Cardlet" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">GitHub</a>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModal('bug')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6a4 4 0 0 1 8 0"/>
                <path d="M4 14h16"/>
                <path d="M12 14v7"/>
                <path d="M4 10h2a2 2 0 0 1 2 2v2H4v-4z"/>
                <path d="M20 10h-2a2 2 0 0 0-2 2v2h4v-4z"/>
                <path d="M6 20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V14H6v6z"/>
              </svg>
              Report a bug
            </button>
            <button
              onClick={() => setModal('feature')}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Request a feature
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-base">
                {modal === 'bug' ? '🐛 Report a Bug' : '✨ Request a Feature'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {needsLogin ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="text-3xl">🔒</div>
                <p className="text-sm text-[var(--muted)]">You need to be logged in to submit feedback.</p>
                <Link
                  href="/login"
                  onClick={closeModal}
                  className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors text-center"
                >
                  Log in to continue
                </Link>
                <button onClick={closeModal} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-[var(--muted)]">
                  {modal === 'bug'
                    ? 'Describe what happened and how to reproduce it.'
                    : 'Describe the feature you\'d like to see added.'}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder={modal === 'bug' ? 'e.g. When I click "Submit" the page crashes…' : 'e.g. I wish I could export my flashcards as PDF…'}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sent || loading}
                    className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
                  >
                    {sent ? '✓ Sent! Thank you' : loading ? 'Sending…' : 'Submit'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
