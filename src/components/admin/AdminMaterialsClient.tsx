'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { StudyMaterial } from '@/types'
import {
  adminUploadMaterialAction,
  adminDeleteMaterialAction,
  adminConvertMaterialToSetAction,
} from '@/lib/actions'
import { MaterialProcessModal } from './MaterialProcessModal'

interface Props { materials: StudyMaterial[] }

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminMaterialsClient({ materials: initialMaterials }: Props) {
  const router = useRouter()
  const [materials, setMaterials] = useState(initialMaterials)
  const [isPending, startTransition] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [converting, setConverting] = useState<string | null>(null)
  const [convertedSetId, setConvertedSetId] = useState<Record<string, string>>({})
  const [processingMaterial, setProcessingMaterial] = useState<StudyMaterial | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setUploadError(null)
    startTransition(async () => {
      try {
        await adminUploadMaterialAction(formData)
        formRef.current?.reset()
        router.refresh()
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    })
  }

  function handleDelete(id: string, fileName: string) {
    if (!confirm('Delete this material? This cannot be undone.')) return
    startTransition(async () => {
      await adminDeleteMaterialAction(id, fileName)
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    })
  }

  function handleConvert(id: string) {
    setConverting(id)
    startTransition(async () => {
      try {
        const { id: setId } = await adminConvertMaterialToSetAction(id)
        setConvertedSetId((prev) => ({ ...prev, [id]: setId }))
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Conversion failed')
      } finally {
        setConverting(null)
      }
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Course Materials</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{materials.length} uploaded · visible in Explore → Study Materials</p>

      {/* Upload form */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 mb-8">
        <h2 className="font-semibold mb-4">Upload New Material</h2>
        <form ref={formRef} onSubmit={handleUpload} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Title *</label>
              <input
                name="title"
                required
                placeholder="e.g. AP Chemistry Chapter 5"
                className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--muted)]">Subject</label>
              <input
                name="subject"
                placeholder="e.g. Chemistry, Biology, History"
                className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Brief description of the material…"
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">File *</label>
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="hidden" name="is_public" value="true" />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                onChange={(e) => {
                  const hidden = e.currentTarget.closest('form')?.querySelector('[name="is_public"]') as HTMLInputElement
                  if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                }}
                className="w-4 h-4 rounded accent-[var(--accent)]"
              />
              Make publicly visible in Explore
            </label>
          </div>
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Uploading…' : '⬆ Upload Material'}
          </button>
        </form>
      </div>

      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] py-16 text-center text-[var(--muted)] text-sm">
          No materials uploaded yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {materials.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex gap-4 items-start">
              <div className="text-2xl shrink-0 mt-0.5">📄</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold truncate">{m.title}</p>
                  {m.subject && (
                    <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {m.subject}
                    </span>
                  )}
                  {m.is_public ? (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">Public</span>
                  ) : (
                    <span className="rounded-full bg-[var(--card-border)]/50 px-2 py-0.5 text-xs font-medium text-[var(--muted)]">Private</span>
                  )}
                </div>
                {m.description && <p className="text-xs text-[var(--muted)] mb-1 line-clamp-2">{m.description}</p>}
                <p className="text-[10px] text-[var(--muted)]">
                  {formatBytes(m.file_size)} · {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-center"
                >
                  View
                </a>
                {/* Two-AI pipeline */}
                <button
                  onClick={() => setProcessingMaterial(m)}
                  className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/8 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-colors text-center"
                >
                  ✦ Process with AI
                </button>
                {convertedSetId[m.id] ? (
                  <Link
                    href={`/sets/${convertedSetId[m.id]}`}
                    className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20 transition-colors text-center"
                  >
                    View Set →
                  </Link>
                ) : (
                  <button
                    onClick={() => handleConvert(m.id)}
                    disabled={isPending || converting === m.id}
                    className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                    title="Quick convert using only title/description (no file reading)"
                  >
                    {converting === m.id ? 'Converting…' : '✨ → Set (quick)'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id, m.file_name)}
                  disabled={isPending}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processingMaterial && (
        <MaterialProcessModal
          material={processingMaterial}
          onClose={() => {
            setProcessingMaterial(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
