'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StudySetCard } from './StudySetCard'
import { CreateSetModal } from './CreateSetModal'
import type { StudySet } from '@/types'
import {
  renameFolderAction,
  deleteFolderAndSetsAction,
  ungroupFolderAction,
} from '@/lib/actions'

interface Props {
  sets: StudySet[]
  dueCount: number
}

const STORAGE_KEY = 'ss_folders'
const DEFAULT_FOLDERS = ['New Subject']

function getFolderStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--card)), var(--card))',
    borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
  }
}

function getFolderIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra') || lower.includes('geometry')) return '📐'
  if (lower.includes('science') || lower.includes('bio') || lower.includes('chem') || lower.includes('phys')) return '🔬'
  if (lower.includes('history') || lower.includes('geo') || lower.includes('aphg')) return '🌍'
  if (lower.includes('english') || lower.includes('lit') || lower.includes('writing')) return '📚'
  if (lower.includes('language') || lower.includes('spanish') || lower.includes('french') || lower.includes('latin')) return '🗣️'
  if (lower.includes('art') || lower.includes('music')) return '🎨'
  if (lower.includes('computer') || lower.includes('code') || lower.includes('program')) return '💻'
  return '📁'
}

export function DashboardClient({ sets, dueCount }: Props) {
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  // Two-option delete confirmation state
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  // Load/sync folders from localStorage + derive from set subjects
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const savedFolders: string[] = saved ? JSON.parse(saved) : DEFAULT_FOLDERS
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
    // Optimistic local update
    persistFolders(folders.map((f) => (f === oldName ? next : f)))
    if (activeFolder === oldName) setActiveFolder(next)
    setRenamingFolder(null)
    // Sync to DB
    startTransition(async () => {
      try { await renameFolderAction(oldName, next) } catch { /* optimistic update already applied */ }
    })
  }

  function handleDeleteSets(name: string) {
    persistFolders(folders.filter((f) => f !== name))
    if (activeFolder === name) setActiveFolder(null)
    setDeletingFolder(null)
    startTransition(async () => {
      try { await deleteFolderAndSetsAction(name) } catch { /* optimistic update already applied */ }
    })
  }

  function handleUngroup(name: string) {
    persistFolders(folders.filter((f) => f !== name))
    if (activeFolder === name) setActiveFolder(null)
    setDeletingFolder(null)
    startTransition(async () => {
      try { await ungroupFolderAction(name) } catch { /* optimistic update already applied */ }
    })
  }

  // Sets in a folder = sets whose subject matches the folder name (case-insensitive)
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

  // ── Folder drill-in view ──────────────────────────────────────────────────
  if (activeFolder) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveFolder(null)}
            className="flex items-center gap-2 text-sm rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] px-3 py-1.5 transition-colors active:scale-95"
          >
            ← All Folders
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getFolderIcon(activeFolder)}</span>
            <h1 className="text-xl font-bold">{activeFolder}</h1>
            <span className="text-sm text-[var(--muted)]">· {setsInFolder.length} {setsInFolder.length === 1 ? 'set' : 'sets'}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors active:scale-95"
          >
            <span className="text-base leading-none">+</span> New Set
          </button>
        </div>

        {setsInFolder.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--card-border)] py-20 text-center">
            <p className="text-4xl">{getFolderIcon(activeFolder)}</p>
            <p className="text-[var(--muted)]">No sets in {activeFolder} yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Create first set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setsInFolder.map((set) => (
              <StudySetCard key={set.id} set={set} />
            ))}
          </div>
        )}

        {showModal && (
          <CreateSetModal
            defaultSubject={activeFolder}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    )
  }

  // ── Folder grid view ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Stats */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 min-w-32">
          <p className="text-xs text-[var(--muted)] mb-1">Study Sets</p>
          <p className="text-3xl font-bold">{sets.length}</p>
        </div>
        <div className={`rounded-xl border px-5 py-4 min-w-32 ${dueCount > 0 ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--card-border)] bg-[var(--card)]'}`}>
          <p className="text-xs text-[var(--muted)] mb-1">Due Today</p>
          <p className={`text-3xl font-bold ${dueCount > 0 ? 'text-[var(--accent)]' : ''}`}>{dueCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 min-w-32">
          <p className="text-xs text-[var(--muted)] mb-1">Subjects</p>
          <p className="text-3xl font-bold">{folders.length}</p>
        </div>
        {isPending && (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 min-w-32 flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Saving…</span>
          </div>
        )}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Subjects</h2>
      </div>

      {/* Folder grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <button onClick={() => handleRename(folder)} className="flex-1 rounded-lg bg-[var(--accent)] py-1.5 text-xs font-medium text-white">Save</button>
                    <button onClick={() => setRenamingFolder(null)} className="flex-1 rounded-lg border border-[var(--card-border)] py-1.5 text-xs font-medium text-[var(--muted)]">Cancel</button>
                  </div>
                </div>
              ) : deletingFolder === folder ? (
                /* Two-option delete confirmation */
                <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-5 flex flex-col gap-3">
                  <p className="text-sm font-semibold">Delete &ldquo;{folder}&rdquo;?</p>
                  <p className="text-xs text-[var(--muted)]">Choose what happens to the sets inside:</p>
                  <button
                    onClick={() => handleDeleteSets(folder)}
                    className="w-full rounded-lg bg-red-500 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    Delete All Sets Inside
                  </button>
                  <button
                    onClick={() => handleUngroup(folder)}
                    className="w-full rounded-lg border border-[var(--card-border)] py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Ungroup (Keep Sets)
                  </button>
                  <button
                    onClick={() => setDeletingFolder(null)}
                    className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
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
                    <span className="text-3xl">{getFolderIcon(folder)}</span>
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
              <button onClick={handleAddFolder} className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white active:scale-95 transition-transform">
                Create
              </button>
              <button onClick={() => { setAddingFolder(false); setNewFolderName('') }} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm font-medium text-[var(--muted)] active:scale-95 transition-transform">
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

      {showModal && <CreateSetModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
