'use client'

import { useState } from 'react'

interface ComingSoonBannerProps {
  feature: string
  description?: string
  className?: string
}

export function ComingSoonBanner({ feature, description, className = '' }: ComingSoonBannerProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) return null

  return (
    <div className={`relative rounded-lg border border-[var(--accent)] bg-[var(--accent)]/5 p-4 ${className}`}>
      <button 
        onClick={() => setIsOpen(false)} 
        className="absolute right-2 top-2 text-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="Close banner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-full bg-[var(--accent)] p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">{feature} Coming Soon</h3>
          {description && <p className="text-sm text-[var(--muted)]">{description}</p>}
        </div>
      </div>
    </div>
  )
}