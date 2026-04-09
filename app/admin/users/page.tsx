import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAllProfiles } from '@/lib/db'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  const profiles = await getAllProfiles()
  return <AdminUsersClient profiles={profiles} />
}
