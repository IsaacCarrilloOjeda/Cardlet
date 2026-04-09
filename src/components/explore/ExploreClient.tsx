'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { copySetAction } from '@/lib/actions'
import type { StudyMaterial, StudySet } from '@/types'

interface Props {
  sets: StudySet[]
  materials: StudyMaterial[]
  query: string
  mode: 'sets' | 'materials'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PublicSetCard({ set }: { set: StudySet }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleCopy() {
    startTransition(async () => {
      const result = await copySetAction(set.id)
      router.push(`/sets/${result.id}`)
    })
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold truncate">{set.title}</h3>
        {set.subject && (
          <span className="inline-block mt-1 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
            {set.subject}
          </span>
        )}
        {set.description && (
          <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{set.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span>{set.card_count ?? 0} cards</span>
        <span>·</span>
        <span>{formatDate(set.created_at)}</span>
      </div>
      <button
        onClick={handleCopy}
        disabled={isPending}
        className="rounded-lg border border-[var(--card-border)] py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-60"
      >
        {isPending ? 'Copying…' : '+ Copy to My Sets'}
      </button>
    </div>
  )
}

function MaterialCard({ material }: { material: StudyMaterial }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 flex flex-col gap-3">
      <div>
        <div className="flex items-start gap-2 mb-1">
          <span className="text-xl shrink-0">📄</span>
          <h3 className="font-semibold leading-tight">{material.title}</h3>
        </div>
        {material.subject && (
          <span className="inline-block rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
            {material.subject}
          </span>
        )}
        {material.description && (
          <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{material.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        {material.file_size && <span>{formatBytes(material.file_size)}</span>}
        {material.file_size && <span>·</span>}
        <span>{formatDate(material.created_at)}</span>
      </div>
      <a
        href={material.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-[var(--card-border)] py-2 text-sm font-medium text-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        View / Download
      </a>
    </div>
  )
}

export function ExploreClient({ sets, materials, query, mode }: Props) {
  const router = useRouter()

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q') as string
    const base = `/explore?mode=${mode}`
    router.push(q.trim() ? `${base}&q=${encodeURIComponent(q.trim())}` : base)
  }

  function switchMode(next: 'sets' | 'materials') {
    router.push(query ? `/explore?mode=${next}&q=${encodeURIComponent(query)}` : `/explore?mode=${next}`)
  }

  const items = mode === 'sets' ? sets : materials
  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Explore</h1>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchMode('sets')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'sets'
              ? 'bg-[var(--accent)] text-white'
              : 'border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
          }`}
        >
          📚 Study Sets
        </button>
        <button
          onClick={() => switchMode('materials')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'materials'
              ? 'bg-[var(--accent)] text-white'
              : 'border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
          }`}
        >
          📁 Study Materials
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={query}
            placeholder={mode === 'sets' ? 'Search public sets…' : 'Search study materials…'}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Search
        </button>
      </form>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] py-20 text-center">
          <p className="text-[var(--muted)]">
            {query
              ? `No ${mode === 'sets' ? 'sets' : 'materials'} found for that search.`
              : mode === 'sets' ? 'No public sets yet.' : 'No study materials available yet.'}
          </p>
        </div>
      ) : (
        <>
          {query && (
            <p className="mb-4 text-sm text-[var(--muted)]">
              {items.length} result{items.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mode === 'sets'
              ? sets.map((set) => <PublicSetCard key={set.id} set={set} />)
              : materials.map((m) => <MaterialCard key={m.id} material={m} />)
            }
          </div>
        </>
      )}
    </div>
  )
}
