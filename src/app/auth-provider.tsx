import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { getSession, onAuthChange } from '@/data/auth'
import { type AuthState, AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    const apply = (session: Parameters<Parameters<typeof onAuthChange>[0]>[0]) => {
      if (!active) return
      const userId = session?.user.id ?? null
      // A different person (or nobody) is signed in: drop the previous user's cached data.
      if (userId !== userIdRef.current) queryClient.clear()
      userIdRef.current = userId
      setState({ status: 'ready', session })
    }

    getSession()
      .then(apply)
      .catch(() => apply(null))
    const unsubscribe = onAuthChange(apply)
    return () => {
      active = false
      unsubscribe()
    }
  }, [queryClient])

  return <AuthContext value={state}>{children}</AuthContext>
}
