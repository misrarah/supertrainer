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
import { FavoriteButton } from './favorite-button'
import { useExercises, useSetExerciseArchived } from './use-exercises'

type Props = {
  exercise: Exercise | null
  userId: string
  onClose: () => void
  onEdit: (exercise: Exercise) => void
  onCreateVariation: (parent: Exercise) => void
  /** Open another exercise (a parent or variation) in this sheet. */
  onSelect: (exercise: Exercise) => void
}

export function ExerciseDetailSheet({
  exercise,
  userId,
  onClose,
  onEdit,
  onCreateVariation,
  onSelect,
}: Props) {
  const archive = useSetExerciseArchived()
  const all = useExercises()
  const isMine = exercise?.owner_id === userId
  const parent = exercise?.variation_of
    ? all.data?.find((e) => e.id === exercise.variation_of)
    : undefined
  const variations = exercise
    ? (all.data ?? []).filter((e) => e.variation_of === exercise.id && !e.archived)
    : []

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
              <FavoriteButton
                exerciseId={exercise.id}
                exerciseName={exercise.name}
                userId={userId}
                withLabel
              />

              {parent && (
                <p className="text-sm">
                  Variation of{' '}
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2"
                    onClick={() => onSelect(parent)}
                  >
                    {parent.name}
                  </button>
                </p>
              )}

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

              {variations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Variations</p>
                  <ul className="divide-y rounded-lg border">
                    {variations.map((variation) => (
                      <li key={variation.id}>
                        <button
                          type="button"
                          className="hover:bg-muted flex min-h-11 w-full items-center px-3 text-left text-sm"
                          onClick={() => onSelect(variation)}
                        >
                          {variation.name}
                        </button>
                      </li>
                    ))}
                  </ul>
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

            <SheetFooter className="gap-2">
              {isMine && (
                <div className="flex gap-2">
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
                </div>
              )}
              <Button
                variant={isMine ? 'ghost' : 'outline'}
                className="h-11"
                onClick={() => onCreateVariation(exercise)}
              >
                Create a variation
              </Button>
            </SheetFooter>
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
