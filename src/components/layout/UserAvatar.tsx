'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  avatar_url: string | null
}

export function UserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthenticated(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setAvatarUrl(profile.avatar_url)
        }
      }
      setLoading(false)
    }
    
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <Link
        href="/profile"
        className="ml-1 rounded-md p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        aria-label="Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    )
  }

  return (
    <Link
      href="/profile"
      className="ml-1 rounded-md p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      aria-label="Profile"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Profile"
          width={24}
          height={24}
          className="h-6 w-6 rounded-full object-cover"
          unoptimized
          onError={(e) => {
            // If image fails to load, fall back to default icon
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement
            if (fallback) fallback.style.display = 'block'
          }}
        />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
      {avatarUrl && (
        <span className="fallback-icon hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
      )}
    </Link>
  )
}