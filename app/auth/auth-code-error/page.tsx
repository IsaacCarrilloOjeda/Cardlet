import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Sign-in failed</h1>
      <p className="text-[var(--muted)] mb-6 max-w-md">
        We couldn&apos;t verify your login link. It may have expired or been used already.
      </p>
      <Link
        href="/login"
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        Back to sign in
      </Link>
    </div>
  )
}
