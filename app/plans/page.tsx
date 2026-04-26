import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans',
  description: 'Choose the perfect Cardlet plan for your study needs.',
}

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-[var(--muted)] max-w-2xl mx-auto">
            Select the perfect plan for your study needs. All plans include core flashcard features.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/5 p-6 text-center mb-16">
          <h2 className="text-2xl font-bold mb-3">Subscription Plans Coming Soon</h2>
          <p className="text-[var(--muted)] mb-6 max-w-2xl mx-auto">
            We're finalizing our subscription plans to provide you with the best value. 
            Currently, all users receive 500 credits monthly for free.
          </p>
          <div className="inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
            Stay Tuned!
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              <p className="text-[var(--muted)] text-sm mt-1">Perfect for casual studying</p>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold">$0<span className="text-[var(--muted)] text-sm font-normal">/month</span></p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Unlimited flashcards
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                500 AI credits monthly
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Basic study tools
              </li>
            </ul>
            <div className="mt-auto">
              <button className="w-full rounded-xl bg-[var(--accent)] py-2 text-sm font-semibold text-white">
                Current Plan
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--accent)] text-white text-xs font-bold py-1 px-3 rounded-full">
              MOST POPULAR
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold">Premium</h3>
              <p className="text-[var(--muted)] text-sm mt-1">For serious students</p>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold">Coming Soon</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                2,000 AI credits monthly
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Advanced study analytics
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Priority AI processing
              </li>
            </ul>
            <div className="mt-auto">
              <button disabled className="w-full rounded-xl bg-[var(--accent)]/70 py-2 text-sm font-semibold text-white cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="text-[var(--muted)] text-sm mt-1">For educators & power users</p>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold">Coming Soon</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Everything in Premium
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Unlimited AI credits
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Team collaboration features
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Priority support
              </li>
            </ul>
            <div className="mt-auto">
              <button disabled className="w-full rounded-xl border border-[var(--card-border)] py-2 text-sm font-semibold cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Need a Custom Solution?</h2>
          <p className="text-[var(--muted)] mb-6 max-w-2xl mx-auto">
            Contact us for enterprise pricing, custom integrations, and dedicated support for your organization.
          </p>
          <a href="mailto:contact@cardlet.app" className="inline-block rounded-full border border-[var(--card-border)] px-6 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  )
}