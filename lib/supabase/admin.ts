import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client for server-side operations that don't need cookies.
 * Uses the service role key to bypass RLS.
 * Perfect for file uploads, database operations, etc.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
