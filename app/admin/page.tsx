import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLoginClient } from '@/components/admin/AdminLoginClient'

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()
  if (authed) redirect('/admin/overview')
  return <AdminLoginClient />
}
