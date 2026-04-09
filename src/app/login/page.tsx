import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login to Smart Stack</h1>
        <form action="/auth/signin" method="post">
          <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded">
            Sign in with Google
          </button>
        </form>
        <form action="/auth/magic-link" method="post" className="space-y-2">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="w-full bg-green-500 text-white py-2 px-4 rounded">
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}