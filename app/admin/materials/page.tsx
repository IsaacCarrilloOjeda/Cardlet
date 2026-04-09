import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAllStudyMaterials } from '@/lib/db'
import { AdminMaterialsClient } from '@/components/admin/AdminMaterialsClient'

export const maxDuration = 60

export default async function AdminMaterialsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin')
  const materials = await getAllStudyMaterials()
  return <AdminMaterialsClient materials={materials} />
}
