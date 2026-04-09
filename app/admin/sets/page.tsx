import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAllStudySetsAdmin } from '@/lib/db'
import { AdminSetsClient } from '@/components/admin/AdminSetsClient'

export default async function AdminSetsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  const sets = await getAllStudySetsAdmin()
  return <AdminSetsClient sets={sets} />
}
