import Link from 'next/link'
import ResendButton from './ResendButton'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6 py-12 bg-[var(--background)]">
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>

        <h1 className="text-2xl font-black mb-2">Email sent!</h1>

        {email ? (
          <p className="text-[var(--muted)] text-sm mb-2">
            We sent a sign-in link to{' '}
            <span className="font-semibold text-[var(--foreground)]">{email}</span>.
          </p>
        ) : (
          <p className="text-[var(--muted)] text-sm mb-2">
            We sent a sign-in link to your email.
          </p>
        )}

        <p className="text-[var(--muted)] text-sm mb-8">
          Click the link in the email to finish signing in. Can&apos;t find it? Check your spam or junk folder.
        </p>

        {email && <ResendButton email={email} />}

        <Link
          href="/login"
          className="mt-6 inline-block text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-4 transition-colors"
        >
          Use a different email
        </Link>
      </div>
    </div>
  )
}
