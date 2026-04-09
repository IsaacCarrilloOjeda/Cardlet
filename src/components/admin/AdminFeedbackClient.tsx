'use client'

import { useTransition } from 'react'
import type { Feedback, FeedbackStatus } from '@/types'
import { adminUpdateFeedbackAction } from '@/lib/actions'

interface Props { feedback: Feedback[] }

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  seen: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-green-500/15 text-green-400',
}

export function AdminFeedbackClient({ feedback }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleStatus(id: string, status: FeedbackStatus) {
    startTransition(async () => {
      await adminUpdateFeedbackAction(id, status)
    })
  }

  const grouped = {
    new: feedback.filter((f) => f.status === 'new'),
    seen: feedback.filter((f) => f.status === 'seen'),
    resolved: feedback.filter((f) => f.status === 'resolved'),
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Feedback</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {grouped.new.length} new · {grouped.seen.length} seen · {grouped.resolved.length} resolved
      </p>

      {feedback.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] py-16 text-center text-[var(--muted)] text-sm">
          No feedback submitted yet.
        </div>
      )}

      {(['new', 'seen', 'resolved'] as FeedbackStatus[]).map((status) => (
        grouped[status].length > 0 && (
          <section key={status} className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 capitalize">{status}</h2>
            <div className="flex flex-col gap-3">
              {grouped[status].map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex gap-4"
                >
                  <div className="shrink-0 mt-0.5">
                    <span className="text-lg">{item.type === 'bug' ? '🐛' : '✨'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status]}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.type === 'bug' ? 'Bug Report' : 'Feature Request'} · {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{item.message}</p>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1">
                    {(['new', 'seen', 'resolved'] as FeedbackStatus[])
                      .filter((s) => s !== item.status)
                      .map((s) => (
                        <button
                          key={s}
                          disabled={isPending}
                          onClick={() => handleStatus(item.id, s)}
                          className="rounded-lg border border-[var(--card-border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 capitalize"
                        >
                          → {s}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  )
}
