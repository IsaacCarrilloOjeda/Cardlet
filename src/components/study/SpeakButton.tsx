'use client'

import { useEffect, useState } from 'react'

interface Props {
  text: string
  className?: string
  size?: number
}

/**
 * Tiny TTS button using the browser's built-in Web Speech API.
 * No deps, no API key. Hidden if the browser lacks support.
 */
export function SpeakButton({ text, className = '', size = 16 }: Props) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  if (!supported) return null

  function speak(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    e.preventDefault()
    const synth = window.speechSynthesis
    if (synth.speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }

  return (
    <button
      type="button"
      onClick={speak}
      title={speaking ? 'Stop' : 'Read aloud'}
      aria-label="Read aloud"
      className={`inline-flex items-center justify-center rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {speaking ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        )}
      </svg>
    </button>
  )
}
