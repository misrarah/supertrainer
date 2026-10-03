import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (see .env.example).')
}

// Only import this from src/data/*.
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // PKCE returns ?code= in the query string, so it doesn't collide with HashRouter's #/ routes.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  },
})

/** Where Supabase should send users back to after sign-in. Includes the GitHub Pages base path. */
export const authRedirectUrl = () => window.location.origin + import.meta.env.BASE_URL
