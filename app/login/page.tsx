import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function friendlyError(raw: string | undefined): string | null {
  if (!raw) return null
  const msg = raw.toLowerCase()
  if (msg.includes('sending')) {
    return "We couldn't send the sign-in email right now. Please try again in a moment."
  }
  if (msg.includes('rate') || msg.includes('security purposes') || msg.includes('too many')) {
    return 'Too many tries. Please wait a minute before trying again.'
  }
  if (msg.includes('invalid') && msg.includes('email')) {
    return "That email address doesn't look right. Double-check and try again."
  }
  if (msg.includes('not allowed') || msg.includes('not authorized')) {
    return 'That email address is not allowed to sign in. Try a different address.'
  }
  return 'Something went wrong. Please try again.'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const { error: rawError } = await searchParams
  const error = friendlyError(rawError)

  return (
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Left panel — branding (desktop only) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'var(--accent)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />

        <div className="relative z-10 max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="10" width="24" height="16" rx="3" fill="white" opacity="0.3" />
              <rect x="4" y="6" width="24" height="16" rx="3" fill="white" opacity="0.6" />
              <rect x="4" y="2" width="24" height="16" rx="3" fill="white" />
            </svg>
            <span className="text-white font-bold text-3xl">Cardlet</span>
          </div>

          <h2 className="text-white text-3xl font-black mb-4 leading-tight">
            Study smarter,<br />not harder
          </h2>
          <p className="text-white/70 text-base">
            AI-powered flashcards that adapt to how you learn. Create sets in seconds, master them for life.
          </p>

          {/* Mock card stack */}
          <div className="mt-10 relative h-36 flex items-center justify-center">
            <div className="absolute w-60 h-28 rounded-2xl bg-white/20 border border-white/30 -rotate-6 shadow-xl" />
            <div className="absolute w-60 h-28 rounded-2xl bg-white/30 border border-white/40 rotate-2 shadow-xl" />
            <div className="relative w-60 h-28 rounded-2xl bg-white shadow-2xl flex flex-col justify-center px-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Term</p>
              <p className="text-gray-900 font-bold text-sm">Mitochondria</p>
              <div className="mt-2 h-px bg-gray-100" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1.5 mb-1">Definition</p>
              <p className="text-gray-500 text-xs">The powerhouse of the cell</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--background)]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="10" width="24" height="16" rx="3" fill="var(--accent)" opacity="0.3" />
              <rect x="4" y="6" width="24" height="16" rx="3" fill="var(--accent)" opacity="0.6" />
              <rect x="4" y="2" width="24" height="16" rx="3" fill="var(--accent)" />
            </svg>
            <span className="font-bold text-2xl">Cardlet</span>
          </div>

          <h1 className="text-2xl font-black mb-1">Log in to Cardlet</h1>
          <p className="text-[var(--muted)] text-sm mb-6">Welcome back! Please sign in to continue.</p>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border p-3 text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)',
                background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* School-computer notice */}
          <div
            className="mb-5 rounded-xl border p-3 flex gap-3 items-start"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--surface)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="12" y1="7.5" x2="12" y2="7.5" />
            </svg>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-[var(--foreground)] mb-0.5">On a school computer?</p>
              <p className="text-[var(--muted)]">
                Google sign-in may be blocked by your school. If it fails, use <span className="font-semibold text-[var(--foreground)]">Send email</span> below instead.
              </p>
            </div>
          </div>

          {/* Google Sign In */}
          <form action="/auth/signin" method="post">
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-white text-gray-800 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.4-.1-2.7-.5-4z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.2 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4-17.7 10.7z" fill="#FF3D00"/>
                <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.5C29.6 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.8 41.2 15.9 45 24 45z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.6 2.7-2.2 5-4.5 6.5l6.6 5.5C41.9 36.9 45 31 45 24c0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--card-border)]" />
            <span className="text-xs text-[var(--muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--card-border)]" />
          </div>

          {/* Magic link */}
          <form action="/auth/magic-link" method="post" className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="w-full h-12 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 text-sm focus:border-[var(--accent)] focus:outline-none focus:bg-[var(--surface-raised)] transition-colors"
            />
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              Send email
            </button>
            <p className="text-xs text-[var(--muted)] text-center">
              We&apos;ll send a one-click sign-in link — no password needed.
            </p>
          </form>

          <p className="mt-6 text-xs text-center text-[var(--muted)]">
            By continuing, you agree to Cardlet&apos;s{' '}
            <span className="underline cursor-pointer">Terms</span> and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
