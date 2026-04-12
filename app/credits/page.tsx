import type { Metadata } from 'next'
import { CreditsPurchaseClient } from '@/components/credits/CreditsPurchaseClient'

export const metadata: Metadata = {
  title: 'Get Credits',
  description: 'Buy AI credits to use with the Cardlet AI tutor, card generator, and more.',
}

export default function CreditsPage() {
  return <CreditsPurchaseClient />
}
