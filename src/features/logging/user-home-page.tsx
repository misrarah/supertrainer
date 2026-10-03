import { useMyProfile } from '@/features/auth/use-my-profile'

export function UserHomePage() {
  const profile = useMyProfile()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hi{profile.data?.display_name ? `, ${profile.data.display_name}` : ''}
      </h1>
      <p className="text-muted-foreground">
        Today’s workout and your recent sessions will appear here.
      </p>
    </div>
  )
}
