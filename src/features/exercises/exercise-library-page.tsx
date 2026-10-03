import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useUserId } from '@/app/auth-context'
import { PageError, PageLoading } from '@/components/page-status'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/data/exercises'
import { errorMessage } from '@/data/errors'
import { EMPTY_FILTERS, type ExerciseFilters } from '@/domain/exercises'
import { ExerciseBrowser } from './exercise-browser'
import { ExerciseDetailSheet } from './exercise-detail-sheet'
import { ExerciseFormSheet } from './exercise-form-sheet'
import { useExercises } from './use-exercises'

export function ExerciseLibraryPage() {
  const userId = useUserId()
  const exercises = useExercises()
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <Button className="h-11" onClick={() => setEditing('new')}>
          <PlusIcon aria-hidden="true" />
          New exercise
        </Button>
      </div>

      {exercises.isPending && <PageLoading />}
      {exercises.isError && (
        <PageError
          message={errorMessage(exercises.error)}
          onRetry={() => void exercises.refetch()}
        />
      )}
      {exercises.data && (
        <ExerciseBrowser
          exercises={exercises.data}
          userId={userId}
          filters={filters}
          onFiltersChange={setFilters}
          onSelect={setSelected}
        />
      )}

      <ExerciseDetailSheet
        exercise={selected}
        userId={userId}
        onClose={() => setSelected(null)}
        onEdit={(exercise) => {
          setSelected(null)
          setEditing(exercise)
        }}
      />
      <ExerciseFormSheet target={editing} userId={userId} onClose={() => setEditing(null)} />
    </div>
  )
}
