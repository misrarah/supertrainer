import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { PageError, PageLoading } from '@/components/page-status'
import { errorMessage } from '@/data/errors'
import { useMyProfile } from '@/features/auth/use-my-profile'
import { useAuth } from './auth-context'
import { clearReturnTo, readReturnTo, saveReturnTo } from './return-to'
import { guardRedirect, isPublicPath } from './route-decision'

/** Wraps every route: sends people to sign-in, onboarding, or their own home as needed. */
export function RouteGuard() {
  const { pathname } = useLocation()
  const auth = useAuth()
  const profile = useMyProfile()

  const signedIn = auth.status === 'ready' && auth.session !== null
  const waiting = auth.status === 'loading' || (signedIn && profile.isPending)
  const redirect =
    waiting || profile.isError
      ? null
      : guardRedirect({
          path: pathname,
          signedIn,
          role: profile.data?.role ?? null,
          returnTo: readReturnTo(),
        })

  useEffect(() => {
    if (waiting) return
    if (!signedIn && redirect === '/login' && !isPublicPath(pathname)) saveReturnTo(pathname)
    if (signedIn && redirect === null) clearReturnTo()
  }, [waiting, signedIn, redirect, pathname])

  if (waiting) return <PageLoading />
  if (profile.isError) {
    return (
      <PageError message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
    )
  }
  if (redirect) return <Navigate to={redirect} replace />
  return <Outlet />
}
