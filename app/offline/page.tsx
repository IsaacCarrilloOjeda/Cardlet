import type { Metadata } from 'next'
import { OfflineClient } from './OfflineClient'

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return <OfflineClient />
}
