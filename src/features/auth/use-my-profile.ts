import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/auth-context'
import { getMyProfile } from '@/data/profiles'

export const profileQueryKey = (userId: string) => ['profile', userId] as const

/** The signed-in user's profile; disabled while signed out. */
export function useMyProfile() {
  const auth = useAuth()
  const userId = auth.status === 'ready' ? (auth.session?.user.id ?? null) : null
  return useQuery({
    queryKey: profileQueryKey(userId ?? ''),
    queryFn: () => getMyProfile(userId ?? ''),
    enabled: userId !== null,
  })
}
