import { describe, expect, it } from 'vitest'
import { guardRedirect, homePath } from './route-decision'

const signedOut = { signedIn: false, role: null, returnTo: null } as const
const newUser = { signedIn: true, role: null, returnTo: null } as const
const trainer = { signedIn: true, role: 'trainer', returnTo: null } as const
const user = { signedIn: true, role: 'user', returnTo: null } as const

describe('homePath', () => {
  it('sends trainers to /t and users to /u', () => {
    expect(homePath('trainer')).toBe('/t')
    expect(homePath('user')).toBe('/u')
  })
})

describe('guardRedirect', () => {
  it('sends signed-out visitors to /login', () => {
    expect(guardRedirect({ ...signedOut, path: '/u' })).toBe('/login')
    expect(guardRedirect({ ...signedOut, path: '/settings' })).toBe('/login')
    expect(guardRedirect({ ...signedOut, path: '/' })).toBe('/login')
  })

  it('lets signed-out visitors see public pages', () => {
    expect(guardRedirect({ ...signedOut, path: '/login' })).toBeNull()
    expect(guardRedirect({ ...signedOut, path: '/privacy' })).toBeNull()
    expect(guardRedirect({ ...signedOut, path: '/join/ABC123' })).toBeNull()
  })

  it('sends users with no role to onboarding, except for join and privacy', () => {
    expect(guardRedirect({ ...newUser, path: '/u' })).toBe('/onboarding')
    expect(guardRedirect({ ...newUser, path: '/login' })).toBe('/onboarding')
    expect(guardRedirect({ ...newUser, path: '/onboarding' })).toBeNull()
    expect(guardRedirect({ ...newUser, path: '/join/ABC123' })).toBeNull()
    expect(guardRedirect({ ...newUser, path: '/privacy' })).toBeNull()
  })

  it('sends signed-in users from /, /login and /onboarding to their home', () => {
    expect(guardRedirect({ ...trainer, path: '/' })).toBe('/t')
    expect(guardRedirect({ ...user, path: '/login' })).toBe('/u')
    expect(guardRedirect({ ...user, path: '/onboarding' })).toBe('/u')
  })

  it('keeps each role out of the other role’s pages', () => {
    expect(guardRedirect({ ...user, path: '/t' })).toBe('/u')
    expect(guardRedirect({ ...user, path: '/t/clients/1' })).toBe('/u')
    expect(guardRedirect({ ...trainer, path: '/u/history' })).toBe('/t')
  })

  it('does not confuse /trainers with trainer pages', () => {
    expect(guardRedirect({ ...user, path: '/trainers' })).toBeNull()
  })

  it('allows shared pages for both roles', () => {
    expect(guardRedirect({ ...user, path: '/settings' })).toBeNull()
    expect(guardRedirect({ ...trainer, path: '/settings' })).toBeNull()
  })

  it('returns to where the user was heading after signing in', () => {
    expect(guardRedirect({ ...user, path: '/login', returnTo: '/u/history' })).toBe('/u/history')
    expect(guardRedirect({ ...trainer, path: '/', returnTo: '/settings' })).toBe('/settings')
  })

  it('returns new users to an invite link instead of onboarding', () => {
    expect(guardRedirect({ ...newUser, path: '/login', returnTo: '/join/ABC123' })).toBe(
      '/join/ABC123',
    )
    expect(guardRedirect({ ...user, path: '/login', returnTo: '/join/ABC123' })).toBe(
      '/join/ABC123',
    )
  })

  it('ignores a return path the role cannot open', () => {
    expect(guardRedirect({ ...user, path: '/login', returnTo: '/t/plans' })).toBe('/u')
  })
})
