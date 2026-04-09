import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated()
  if (!authed) return <>{children}</>
  return <AdminShell>{children}</AdminShell>
}
