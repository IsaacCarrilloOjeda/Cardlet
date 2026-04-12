'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MySet { id: string; title: string }

interface Props {
  userId: string
  mySets: MySet[]
  initialSessionId: string | null
  initialSetId: string | null
}

interface Card { id: string; front: string; back: string }
interface Peer { userId: string; cardIndex: number; flipped: boolean }

/**
 * Lightweight 2-player co-study via Supabase Realtime presence + broadcast.
 * Either user can flip the deck. State syncs via broadcasts; presence shows who's in.
 */
export function StudyBuddyClient({ userId, mySets, initialSessionId, initialSetId }: Props) {
  const supabase = useRef(createClient()).current
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const [setId, setSetId] = useState<string | null>(initialSetId)
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [peers, setPeers] = useState<Peer[]>([])
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Load cards once setId is known
  useEffect(() => {
    if (!setId) return
    supabase
      .from('cards')
      .select('id, front, back')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setCards(data)
      })
  }, [setId, supabase])

  // Subscribe to realtime channel when sessionId is set
  useEffect(() => {
    if (!sessionId) return
    const channel = supabase.channel(`buddy:${sessionId}`, { config: { presence: { key: userId } } })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, { cardIndex: number; flipped: boolean }[]>
        const list: Peer[] = Object.entries(state).map(([uid, arr]) => ({
          userId: uid,
          cardIndex: arr[0]?.cardIndex ?? 0,
          flipped: arr[0]?.flipped ?? false,
        }))
        setPeers(list)
      })
      .on('broadcast', { event: 'flip' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setIndex(payload.index)
          setFlipped(payload.flipped)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ cardIndex: index, flipped })
        }
      })

    channelRef.current = channel
    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  function broadcast(nextIndex: number, nextFlipped: boolean) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'flip',
      payload: { userId, index: nextIndex, flipped: nextFlipped },
    })
    channelRef.current?.track({ cardIndex: nextIndex, flipped: nextFlipped })
  }

  function host(chosenSetId: string) {
    const newId = crypto.randomUUID()
    setSessionId(newId)
    setSetId(chosenSetId)
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/study/buddy?session=${newId}&set=${chosenSetId}`)
    }
  }

  function next() {
    if (index + 1 >= cards.length) return
    setIndex(index + 1)
    setFlipped(false)
    broadcast(index + 1, false)
  }

  function flip() {
    setFlipped((f) => {
      broadcast(index, !f)
      return !f
    })
  }

  if (!sessionId || !setId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">👥 Study Buddy</h1>
        <p className="text-sm text-[var(--muted)] mb-6">Pick a set to host. Share the link with a friend to study together in real time.</p>
        <div className="flex flex-col gap-2">
          {mySets.map((s) => (
            <button
              key={s.id}
              onClick={() => host(s.id)}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-left hover:border-[var(--accent)] transition-colors"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const current = cards[index]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">👥 Study Buddy</h1>
        <span className="text-xs text-[var(--muted)]">{peers.length} in session</span>
      </div>
      {shareUrl && (
        <div className="mb-4 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3">
          <p className="text-xs text-[var(--muted)] mb-1">Share this link:</p>
          <code className="text-xs break-all">{shareUrl}</code>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="ml-2 text-xs text-[var(--accent)] underline"
          >
            Copy
          </button>
        </div>
      )}
      {current ? (
        <div className="flex flex-col gap-4">
          <div
            onClick={flip}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center cursor-pointer min-h-48 flex items-center justify-center"
          >
            <p className="text-xl font-semibold">{flipped ? current.back : current.front}</p>
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)]">
            <span>{index + 1} / {cards.length}</span>
            <button onClick={next} className="text-[var(--accent)] font-medium">Next →</button>
          </div>
        </div>
      ) : (
        <p className="text-center text-[var(--muted)]">Loading cards…</p>
      )}
    </div>
  )
}
