import type { Session } from '@supabase/supabase-js'
import { authRedirectUrl, supabase } from '@/lib/supabase'
import { toAppError } from './errors'

export type { Session }

/**
 * Resolves the current session. On the first call after an OAuth or magic-link redirect, the
 * Supabase client exchanges the `?code=` in the URL for a session; we then remove it from the URL.
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  stripAuthParamsFromUrl()
  if (error) throw toAppError(error)
  return data.session
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectUrl() },
  })
  if (error) throw toAppError(error)
}

export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: authRedirectUrl() },
  })
  if (error) throw toAppError(error)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}

/** Deletes the signed-in user's account and data (see delete_account() in the migrations). */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account')
  if (error) throw toAppError(error)
  // The auth user no longer exists, so only clear the local session.
  await supabase.auth.signOut({ scope: 'local' })
}

let authErrorFromUrl: string | null = readAuthErrorFromUrl()

/** An error Supabase put in the redirect URL (e.g. an expired magic link), read once. */
export function takeAuthErrorFromUrl(): string | null {
  const message = authErrorFromUrl
  authErrorFromUrl = null
  return message
}

function readAuthErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('error_description') ?? params.get('error')
}

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  const keys = ['code', 'error', 'error_code', 'error_description']
  if (!keys.some((key) => url.searchParams.has(key))) return
  for (const key of keys) url.searchParams.delete(key)
  window.history.replaceState(window.history.state, '', url.toString())
}
