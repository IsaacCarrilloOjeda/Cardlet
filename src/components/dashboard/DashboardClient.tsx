'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { StudySetCard } from './StudySetCard'
import { CreateSetModal } from './CreateSetModal'
import { DashboardSidebar } from './DashboardSidebar'
import { DailyChallengeCard } from './DailyChallengeCard'
import { AutoTagWidget } from './AutoTagWidget'
import type { StudySet, DailyChallengeCard as DailyCard } from '@/types'
import {
  renameFolderAction,
  deleteFolderAndSetsAction,
  ungroupFolderAction,
} from '@/lib/actions'

interface Props {
  sets: StudySet[]
  dueCount: number
  streak?: number
  mistakeCount?: number
  dailyCard?: DailyCard | null
}

const STORAGE_KEY = 'ss_folders'
const DEFAULT_FOLDERS: string[] = []

function getFolderStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--surface)), var(--surface))',
    borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
  }
}

function getFolderIcon(_name: string) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  )
}

export function DashboardClient({ sets, dueCount, streak = 0, mistakeCount = 0, dailyCard = null }: Props) {
  const router = useRouter()
  const [folders, setFolders] = useState<string[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const noInteraction = !addingFolder && !renamingFolder && !deletingFolder && !showModal
  const dashShortcuts = useMemo(() => ({
    n: () => setShowModal(true),
    '/': () => router.push('/explore'),
  }), [router])
  useKeyboardShortcuts(dashShortcuts, { enabled: noInteraction })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const savedFolders: string[] = saved ? JSON.parse(saved) : []
    const subjectFolders = Array.from(new Set(sets.map((s) => s.subject).filter(Boolean))) as string[]
    const merged = Array.from(new Set([...savedFolders, ...subjectFolders]))
    setFolders(merged)
  }, [sets])

  function persistFolders(next: string[]) {
    setFolders(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function handleAddFolder() {
    const name = newFolderName.trim()
    if (!name || folders.includes(name)) { setAddingFolder(false); setNewFolderName(''); return }
    persistFolders([...folders, name])
    setAddingFolder(false)
    setNewFolderName('')
  }

  function handleRename(oldName: string) {
    const next = renameValue.trim()
    if (!next || next === oldName || folders.includes(next)) { setRenamingFolder(null); return }
    persistFolders(folders.map((f) => (f === oldName ? next : f)))
    if (activeFolder === oldName) setActiveFolder(next)
    setRenamingFolder(null)
    startTransition(async () => {
      try { await renameFolderAction(oldName, next) } catch { /* optimistic */ }
    })
  }

  function handleDeleteSets(name: string) {
    persistFolders(folders.filter((f) => f !== name))
    if (activeFolder === name) setActiveFolder(null)
    setDeletingFolder(null)
    startTransition(async () => {
      try { await deleteFolderAndSetsAction(name) } catch { /* optimistic */ }
    })
  }

  function handleUngroup(name: string) {
    persistFolders(folders.filter((f) => f !== name))
    if (activeFolder === name) setActiveFolder(null)
    setDeletingFolder(null)
    startTransition(async () => {
      try { await ungroupFolderAction(name) } catch { /* optimistic */ }
    })
  }

  const setsInFolder = useMemo(() => {
    if (!activeFolder) return []
    return sets.filter((s) => s.subject?.toLowerCase() === activeFolder.toLowerCase())
  }, [sets, activeFolder])

  const folderSetCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const f of folders) {
      map[f] = sets.filter((s) => s.subject?.toLowerCase() === f.toLowerCase()).length
    }
    return map
  }, [sets, folders])

  // ── Folder drill-in view ───────────────────────────────────────────────────
  const folderContent = activeFolder ? (
    <div className="flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => setActiveFolder(null)}
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Subjects
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center">{getFolderIcon(activeFolder)}</span>
          <h1 className="text-xl font-bold">{activeFolder}</h1>
          <span className="text-sm text-[var(--muted)]">· {setsInFolder.length} {setsInFolder.length === 1 ? 'set' : 'sets'}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          + New Set
        </button>
      </div>

      {setsInFolder.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--card-border)] py-20 text-center">
          <div className="mb-2">{getFolderIcon(activeFolder)}</div>
          <p className="text-[var(--muted)]">No sets in {activeFolder} yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Create first set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {setsInFolder.map((set) => (
            <StudySetCard key={set.id} set={set} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateSetModal defaultSubject={activeFolder} subjects={folders} onClose={() => setShowModal(false)} />
      )}
    </div>
  ) : null

  // ── Home view ──────────────────────────────────────────────────────────────
  const homeContent = !activeFolder ? (
    <div className="flex-1 px-6 py-8 max-w-5xl">
      {/* Top stat row: streak + mistake deck */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 flex items-center gap-3">
          <span className="text-2xl leading-none shrink-0 select-none">{'🔥\uFE0F'}</span>
          <div>
            <p className="text-xl font-bold leading-tight">{streak}</p>
            <p className="text-[11px] text-[var(--muted)]">day streak</p>
          </div>
        </div>
        {mistakeCount > 0 ? (
          <Link
            href="/study/mistakes"
            className="rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4 flex items-center gap-3 hover:border-red-500/50 transition-colors group"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Review Mistakes</p>
              <p className="text-[11px] text-[var(--muted)]">{mistakeCount} {mistakeCount === 1 ? 'card needs' : 'cards need'} another look</p>
            </div>
            <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">→</span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)] shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <div>
              <p className="text-sm font-bold leading-tight">No mistakes</p>
              <p className="text-[11px] text-[var(--muted)]">You&apos;re crushing every card</p>
            </div>
          </div>
        )}
      </div>

      {/* Daily Challenge */}
      {dailyCard && <DailyChallengeCard card={dailyCard} />}

      {/* Auto-tag suggestion widget */}
      <AutoTagWidget sets={sets} />

      {/* Due-card banner */}
      {dueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none shrink-0 select-none">{'🔥\uFE0F'}</span>
            <div>
              <p className="font-bold text-sm text-[var(--foreground)]">
                {dueCount} {dueCount === 1 ? 'card' : 'cards'} due for review today
              </p>
              <p className="text-xs text-[var(--muted)]">Keep your streak going!</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors shrink-0"
          >
            Resume Review →
          </Link>
        </motion.div>
      )}

      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Your Library</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">{sets.length} sets · {folders.length} subjects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          + New Set
        </button>
      </div>

      {/* Folder grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {folders.map((folder) => (
            <motion.div
              key={folder}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              {renamingFolder === folder ? (
                <div className="rounded-2xl border-2 p-5 flex flex-col gap-3" style={getFolderStyle()}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(folder); if (e.key === 'Escape') setRenamingFolder(null) }}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Folder name"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleRename(folder)} className="flex-1 rounded-full bg-[var(--accent)] py-1.5 text-xs font-semibold text-white">Save</button>
                    <button onClick={() => setRenamingFolder(null)} className="flex-1 rounded-full border border-[var(--card-border)] py-1.5 text-xs font-medium text-[var(--muted)]">Cancel</button>
                  </div>
                </div>
              ) : deletingFolder === folder ? (
                <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-5 flex flex-col gap-3">
                  <p className="text-sm font-semibold">Delete &ldquo;{folder}&rdquo;?</p>
                  <p className="text-xs text-[var(--muted)]">Choose what happens to the sets inside:</p>
                  <button onClick={() => handleDeleteSets(folder)} className="w-full rounded-full bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors">
                    Delete All Sets Inside
                  </button>
                  <button onClick={() => handleUngroup(folder)} className="w-full rounded-full border border-[var(--card-border)] py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors">
                    Ungroup (Keep Sets)
                  </button>
                  <button onClick={() => setDeletingFolder(null)} className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveFolder(folder)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveFolder(folder) }}
                  className="group w-full rounded-2xl border-2 p-5 text-left transition-shadow hover:shadow-lg cursor-pointer"
                  style={getFolderStyle()}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="mb-1">{getFolderIcon(folder)}</div>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { setRenamingFolder(folder); setRenameValue(folder) }}
                        className="rounded-md p-1 hover:bg-white/20 transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingFolder(folder)}
                        className="rounded-md p-1 hover:bg-red-500/20 transition-colors text-[var(--muted)] hover:text-red-500"
                        title="Delete folder"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-base mb-1">{folder}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {folderSetCounts[folder] ?? 0} {folderSetCounts[folder] === 1 ? 'set' : 'sets'}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new folder card */}
        {addingFolder ? (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/5 p-5 flex flex-col gap-3"
          >
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') } }}
              placeholder="Subject name…"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleAddFolder} className="flex-1 rounded-full bg-[var(--accent)] py-2 text-sm font-semibold text-white active:scale-95 transition-transform">
                Create
              </button>
              <button onClick={() => { setAddingFolder(false); setNewFolderName('') }} className="flex-1 rounded-full border border-[var(--card-border)] py-2 text-sm font-medium text-[var(--muted)] active:scale-95 transition-transform">
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            layout
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={() => setAddingFolder(true)}
            className="rounded-2xl border-2 border-dashed border-[var(--card-border)] p-5 flex flex-col items-center justify-center gap-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors min-h-[140px]"
          >
            <span className="text-3xl font-light leading-none">+</span>
            <span className="text-sm font-medium">New Subject</span>
          </motion.button>
        )}
      </div>

      {showModal && <CreateSetModal subjects={folders} onClose={() => setShowModal(false)} />}
    </div>
  ) : null

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <DashboardSidebar
        folders={folders}
        folderSetCounts={folderSetCounts}
        activeFolder={activeFolder}
        onSelectFolder={setActiveFolder}
        onAddFolder={() => setAddingFolder(true)}
      />
      {activeFolder ? folderContent : homeContent}
    </div>
  )
}
