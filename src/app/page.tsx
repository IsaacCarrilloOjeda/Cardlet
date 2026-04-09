import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Smart Stack!</h1>
      <p>Hello, {user.email}!</p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}