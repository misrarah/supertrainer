import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DELETED_ACCOUNT } from '@/components/user-avatar'
import type { Exercise } from '@/data/exercises'
import { errorMessage } from '@/data/errors'
import {
  CAUTION_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  PATTERN_LABELS,
  TRACKING_LABELS,
} from './labels'
import { useSetExerciseArchived } from './use-exercises'

type Props = {
  exercise: Exercise | null
  userId: string
  onClose: () => void
  onEdit: (exercise: Exercise) => void
}

export function ExerciseDetailSheet({ exercise, userId, onClose, onEdit }: Props) {
  const archive = useSetExerciseArchived()
  const isMine = exercise?.owner_id === userId

  const toggleArchived = (target: Exercise) =>
    archive.mutate(
      { id: target.id, archived: !target.archived },
      {
        onSuccess: (saved) => {
          toast.success(saved.archived ? 'Exercise archived' : 'Exercise restored')
          onClose()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )

  return (
    <Sheet open={exercise !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {exercise && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{exercise.name}</SheetTitle>
              <SheetDescription>{sourceLabel(exercise, userId)}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4">
              {exercise.description && <p className="leading-relaxed">{exercise.description}</p>}

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <Detail term="Movement">
                  {exercise.movement_pattern && PATTERN_LABELS[exercise.movement_pattern]}
                </Detail>
                <Detail term="Main muscle">
                  {exercise.primary_muscle && MUSCLE_LABELS[exercise.primary_muscle]}
                </Detail>
                <Detail term="Also works">
                  {exercise.secondary_muscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                </Detail>
                <Detail term="Equipment">
                  {exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}
                </Detail>
                <Detail term="Difficulty">
                  {exercise.difficulty && DIFFICULTY_LABELS[exercise.difficulty]}
                </Detail>
                <Detail term="Logged as">{TRACKING_LABELS[exercise.tracking_type]}</Detail>
              </dl>

              {exercise.caution_tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Take care with</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.caution_tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {CAUTION_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {exercise.video_url && (
                <a
                  href={exercise.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm underline underline-offset-2"
                >
                  Watch a demo (opens in a new tab)
                </a>
              )}
            </div>

            {isMine && (
              <SheetFooter className="flex-row gap-2">
                <Button className="h-11 flex-1" onClick={() => onEdit(exercise)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  disabled={archive.isPending}
                  onClick={() => toggleArchived(exercise)}
                >
                  {exercise.archived ? 'Restore' : 'Archive'}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  if (!children) return null
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </>
  )
}

function sourceLabel(exercise: Exercise, userId: string): string {
  if (exercise.is_builtin) return 'Built-in exercise'
  if (exercise.owner_id === userId) return 'Created by you'
  if (exercise.owner_id === null) return `Created by: ${DELETED_ACCOUNT}`
  return 'Custom exercise'
}
