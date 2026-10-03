import { useQuery } from '@tanstack/react-query'
import { PageError, PageLoading } from '@/components/page-status'
import { UserAvatar } from '@/components/user-avatar'
import { errorMessage } from '@/data/errors'
import { listTrainers } from '@/data/profiles'

export function TrainersPage() {
  const trainers = useQuery({ queryKey: ['trainers'], queryFn: listTrainers })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Trainers</h1>
        <p className="text-muted-foreground text-sm">
          Trainers using Supertrainer. To work with one, ask them for an invite link.
        </p>
      </div>

      {trainers.isPending && <PageLoading />}
      {trainers.isError && (
        <PageError message={errorMessage(trainers.error)} onRetry={() => void trainers.refetch()} />
      )}
      {trainers.data?.length === 0 && (
        <p className="text-muted-foreground">No trainers have signed up yet.</p>
      )}
      {trainers.data && trainers.data.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {trainers.data.map((trainer) => (
            <li key={trainer.id} className="flex items-center gap-3 p-3">
              <UserAvatar
                name={trainer.display_name}
                url={trainer.avatar_url}
                className="size-10"
              />
              <span className="font-medium">{trainer.display_name ?? 'Unnamed trainer'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
