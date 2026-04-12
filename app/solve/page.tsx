import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EquationSolverClient } from '@/components/solve/EquationSolverClient'

export default async function SolvePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <EquationSolverClient />
}
