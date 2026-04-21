import type { Metadata } from 'next'
import { OfflineStudyClient } from './OfflineStudyClient'

export const metadata: Metadata = {
  title: 'Offline Study',
  robots: { index: false, follow: false },
}

export default async function OfflineStudyPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  return <OfflineStudyClient setId={setId} />
}
