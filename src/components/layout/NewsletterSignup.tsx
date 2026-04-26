'use client'

import { useState } from 'react'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }
    
    setStatus('submitting')
    
    // In a real implementation, you would send this to your API
    // For now, we'll simulate success after a delay
    setTimeout(() => {
      setStatus('success')
      setMessage('Thank you for subscribing!')
      setEmail('')
    }, 1000)
  }

  return (
    <div className="bg-[var(--surface)] py-12 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
        <p className="text-[var(--muted)] mb-6">
          Subscribe to our newsletter for study tips, feature updates, and special offers.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            disabled={status === 'submitting' || status === 'success'}
          />
          <button
            type="submit"
            disabled={status === 'submitting' || status === 'success'}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        
        {message && (
          <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}