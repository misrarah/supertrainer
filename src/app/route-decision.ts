import type { Role } from '@/data/profiles'

export function homePath(role: Role): '/t' | '/u' {
  return role === 'trainer' ? '/t' : '/u'
}

const isUnder = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

/** Pages anyone can open without signing in. */
export function isPublicPath(path: string): boolean {
  return path === '/login' || path === '/privacy' || isUnder(path, '/join')
}

type GuardInput = {
  path: string
  signedIn: boolean
  role: Role | null
  /** Where a signed-out user was heading before being sent to /login. */
  returnTo: string | null
}

/** Where to redirect to, or null to show the requested page. */
export function guardRedirect({ path, signedIn, role, returnTo }: GuardInput): string | null {
  if (!signedIn) return isPublicPath(path) ? null : '/login'

  const usableReturnTo =
    returnTo && returnTo !== '/login' && returnTo !== '/onboarding' && returnTo !== path
      ? returnTo
      : null

  if (role === null) {
    if (path === '/onboarding' || path === '/privacy' || isUnder(path, '/join')) return null
    // Accepting an invite sets the role, so an invite link skips onboarding.
    if (usableReturnTo && isUnder(usableReturnTo, '/join')) return usableReturnTo
    return '/onboarding'
  }

  if (path === '/' || path === '/login' || path === '/onboarding') {
    return usableReturnTo
      ? (guardRedirect({ path: usableReturnTo, signedIn, role, returnTo: null }) ?? usableReturnTo)
      : homePath(role)
  }
  if (role === 'user' && isUnder(path, '/t')) return homePath(role)
  if (role === 'trainer' && isUnder(path, '/u')) return homePath(role)
  return null
}
