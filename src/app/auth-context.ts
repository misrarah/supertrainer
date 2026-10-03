import { createContext, useContext } from 'react'
import type { Session } from '@/data/auth'

export type AuthState = { status: 'loading' } | { status: 'ready'; session: Session | null }

export const AuthContext = createContext<AuthState>({ status: 'loading' })

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

/** The signed-in user's id. Only use below the route guard, which guarantees a session. */
export function useUserId(): string {
  const auth = useAuth()
  if (auth.status !== 'ready' || !auth.session) throw new Error('useUserId needs a signed-in user')
  return auth.session.user.id
}
