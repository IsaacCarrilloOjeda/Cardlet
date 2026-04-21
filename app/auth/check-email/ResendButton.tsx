'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const COOLDOWN_SECONDS = 30

export default function ResendButton({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [cooldown, setCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function handleResend() {
    if (status === 'sending' || cooldown > 0) return
    setStatus('sending')
    setErrorMsg(null)
    try {
      const body = new FormData()
      body.set('email', email)
      const res = await fetch('/auth/magic-link', {
        method: 'POST',
        body,
        redirect: 'manual',
      })
      if (res.type === 'opaqueredirect' || res.ok || res.status === 303) {
        setStatus('sent')
        setCooldown(COOLDOWN_SECONDS)
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        setErrorMsg('Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  const disabled = status === 'sending' || cooldown > 0
  const label =
    status === 'sending'
      ? 'Sending…'
      : status === 'sent'
      ? 'Email resent!'
      : cooldown > 0
      ? `Resend in ${cooldown}s`
      : 'Click here to resend'

  return (
    <div>
      <button
        type="button"
        onClick={handleResend}
        disabled={disabled}
        className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      {errorMsg && (
        <p className="mt-2 text-xs text-[var(--danger)]">{errorMsg}</p>
      )}
    </div>
  )
}
