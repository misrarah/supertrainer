import { StarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/data/errors'
import { cn } from '@/lib/utils'
import { useFavoriteExerciseIds, useToggleFavorite } from './use-exercises'

type Props = {
  exerciseId: string
  exerciseName: string
  userId: string
  /** Show "Favourite" next to the star. */
  withLabel?: boolean
  className?: string
}

export function FavoriteButton({ exerciseId, exerciseName, userId, withLabel, className }: Props) {
  const favorites = useFavoriteExerciseIds()
  const toggle = useToggleFavorite(userId)
  const isFavorite = favorites.data?.has(exerciseId) ?? false

  return (
    <Button
      type="button"
      variant={withLabel ? 'outline' : 'ghost'}
      size={withLabel ? 'default' : 'icon-lg'}
      aria-pressed={isFavorite}
      aria-label={
        withLabel
          ? undefined
          : `${isFavorite ? 'Remove' : 'Add'} ${exerciseName} ${isFavorite ? 'from' : 'to'} favourites`
      }
      disabled={favorites.isPending}
      onClick={() =>
        toggle.mutate(
          { exerciseId, favorite: !isFavorite },
          { onError: (error) => toast.error(errorMessage(error)) },
        )
      }
      className={cn(withLabel ? 'h-11' : 'size-11 shrink-0', className)}
    >
      <StarIcon
        aria-hidden="true"
        className={cn(
          'size-5',
          isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground',
        )}
      />
      {withLabel && (isFavorite ? 'In favourites' : 'Add to favourites')}
    </Button>
  )
}
