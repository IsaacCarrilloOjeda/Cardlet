import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminStats } from '@/lib/db'
import { AdminOverviewClient } from '@/components/admin/AdminOverviewClient'

export default async function AdminOverviewPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  const stats = await getAdminStats()
  return <AdminOverviewClient stats={stats} />
}
