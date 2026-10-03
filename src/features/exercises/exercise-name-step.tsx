import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Exercise } from '@/data/exercises'
import { findSimilarExercises } from '@/domain/exercise-match'
import { FavoriteButton } from './favorite-button'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from './labels'

type Props = {
  name: string
  onNameChange: (name: string) => void
  exercises: Exercise[]
  userId: string
  onCreateNew: () => void
  onCreateVariation: (parent: Exercise) => void
}

/** First step of "New exercise": look for an existing match before creating one. */
export function ExerciseNameStep({
  name,
  onNameChange,
  exercises,
  userId,
  onCreateNew,
  onCreateVariation,
}: Props) {
  const matches = useMemo(() => findSimilarExercises(name, exercises), [name, exercises])
  const exact = matches.find((match) => match.exact)
  const searched = name.trim().length >= 3

  return (
    <form
      noValidate
      className="space-y-5 px-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim()) onCreateNew()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new-exercise-name">What’s the exercise called?</Label>
        <Input
          id="new-exercise-name"
          autoFocus
          autoComplete="off"
          className="h-11"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          aria-describedby="new-exercise-hint"
        />
        <p id="new-exercise-hint" className="text-muted-foreground text-xs">
          We’ll check the library first, so you can reuse or vary an existing exercise.
        </p>
      </div>

      {searched && (
        <section aria-labelledby="matches-heading" aria-live="polite" className="space-y-3">
          <h3 id="matches-heading" className="text-sm font-medium">
            {matches.length > 0 ? 'Already in the library' : 'No similar exercises found'}
          </h3>
          {exact && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              “{exact.exercise.name}” already exists. Star it to keep it handy, or make your own
              variation of it.
            </p>
          )}
          {matches.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {matches.map(({ exercise }) => (
                <li key={exercise.id} className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {[
                        exercise.primary_muscle && MUSCLE_LABELS[exercise.primary_muscle],
                        exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', '),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <FavoriteButton
                    exerciseId={exercise.id}
                    exerciseName={exercise.name}
                    userId={userId}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    onClick={() => onCreateVariation(exercise)}
                    aria-label={`Make a variation of ${exercise.name}`}
                  >
                    Variation
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Button type="submit" className="h-11 w-full" disabled={!name.trim()}>
        {matches.length > 0 ? 'None of these — create a new exercise' : 'Create a new exercise'}
      </Button>
    </form>
  )
}
