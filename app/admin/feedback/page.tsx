import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAllFeedback } from '@/lib/db'
import { AdminFeedbackClient } from '@/components/admin/AdminFeedbackClient'

export default async function AdminFeedbackPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  const feedback = await getAllFeedback()
  return <AdminFeedbackClient feedback={feedback} />
}
