import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const DELETED_ACCOUNT = 'Deleted account'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function UserAvatar({
  name,
  url,
  className,
}: {
  name: string | null
  url: string | null
  className?: string
}) {
  const label = name ?? DELETED_ACCOUNT
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback aria-hidden="true">{initials(label) || '?'}</AvatarFallback>
    </Avatar>
  )
}
