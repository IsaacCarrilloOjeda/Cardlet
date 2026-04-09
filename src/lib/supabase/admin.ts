import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// This client uses the service-role key and bypasses RLS.
// ONLY use in server-side admin routes — never expose to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
