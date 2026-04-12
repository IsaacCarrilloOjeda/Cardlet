'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAction } from '@/lib/actions'
import { useTheme, ACCENT_COLORS, type AccentKey } from '@/components/layout/ThemeProvider'
import { BarProgress } from '@/components/layout/BarProgress'
import { useQuizSettings } from '@/hooks/useQuizSettings'
import type { Profile } from '@/types'

interface Stats {
  setCount: number
  cardCount: number
}

interface Props {
  profile: Profile
  stats: Stats
  email: string
}

export function ProfileClient({ profile, stats, email }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(profile.is_private ?? false)
  const { accentKey, setAccent } = useTheme()
  const { settings: quizSettings, update: updateQuiz } = useQuizSettings()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } catch (err) {
      console.error('Avatar upload failed', err)
    } finally {
      setIsUploading(false)
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    formData.set('avatar_url', avatarUrl)
    formData.set('is_private', String(isPrivate))
    setMessage(null)
    startTransition(async () => {
      await updateProfileAction(formData)
      setMessage('Profile saved!')
      setTimeout(() => setMessage(null), 3000)
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--accent)]">{profile.streak}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Day Streak 🔥</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold">{stats.setCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Study Sets</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold">{stats.cardCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Cards Created</p>
        </div>
      </div>

      {/* XP / Level */}
      {(() => {
        const xp = profile.xp ?? 0
        const points = profile.points_earned ?? 0
        const level = Math.floor(Math.sqrt(xp / 100)) + 1
        const xpForCurrent = (level - 1) ** 2 * 100
        const xpForNext = level ** 2 * 100
        const progress = Math.min(100, Math.round(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100))
        const badge = level >= 20 ? '👑' : level >= 10 ? '💎' : level >= 5 ? '⭐' : '🌱'
        return (
          <div className="mb-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{badge}</span>
                <div>
                  <p className="text-sm font-semibold">Level {level}</p>
                  <p className="text-xs text-[var(--muted)]">{points.toLocaleString()} points · {xp.toLocaleString()} XP</p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)]">{xpForNext - xp} XP to next</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background)]">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )
      })()}

      {/* Edit form */}
      <form ref={formRef} onSubmit={handleSave} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 flex flex-col gap-5">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div
            className="h-20 w-20 rounded-full bg-[var(--background)] border-2 border-[var(--card-border)] overflow-hidden flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Profile Photo</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-1 text-xs text-[var(--accent)] hover:underline disabled:opacity-60"
            >
              {isUploading ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Username */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Username</label>
          <input
            name="username"
            defaultValue={profile.username ?? ''}
            placeholder="Choose a username"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Privacy toggle */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Account Privacy</label>
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 ${isPrivate ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <span className="text-sm">{isPrivate ? 'Private account' : 'Public account'}</span>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {isPrivate
                  ? 'Your name and photo are hidden on leaderboards. Public sets remain visible.'
                  : 'Your username and photo are visible on leaderboards.'}
              </p>
            </div>
          </label>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            value={email}
            readOnly
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)] cursor-not-allowed"
          />
        </div>

        {message && <p className="text-sm text-green-400">{message}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Accent color settings */}
      <div className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-sm font-semibold">Appearance</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">Accent Color</p>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setAccent(key)}
              title={val.label}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                style={{
                  background: val.accent,
                  outline: accentKey === key ? `3px solid ${val.accent}` : '3px solid transparent',
                  outlineOffset: '2px',
                }}
              />
              <span className="text-[10px] text-[var(--muted)]">{val.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Settings */}
      <div className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-sm font-semibold">Quiz Settings</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Click to Continue</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">Wait for a tap before advancing to the next question</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={quizSettings.clickToContinue}
            onClick={() => updateQuiz({ clickToContinue: !quizSettings.clickToContinue })}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              quizSettings.clickToContinue ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                quizSettings.clickToContinue ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* AI Usage (BarProgress) */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">AI Usage</h2>
        <BarProgress />
      </div>

      {/* Sign out */}
      <div className="mt-6 text-center">
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-[var(--muted)] hover:text-red-400 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
