import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createExercise,
  type Exercise,
  type ExerciseInput,
  listExercises,
  setExerciseArchived,
  updateExercise,
} from '@/data/exercises'

export const exercisesQueryKey = ['exercises'] as const

export function useExercises() {
  return useQuery({ queryKey: exercisesQueryKey, queryFn: listExercises, staleTime: 5 * 60_000 })
}

/** Keeps the cached list in step after a create or update, without refetching ~150 rows. */
function useUpsertIntoCache() {
  const queryClient = useQueryClient()
  return (saved: Exercise) =>
    queryClient.setQueryData<Exercise[]>(exercisesQueryKey, (list = []) =>
      list.some((e) => e.id === saved.id)
        ? list.map((e) => (e.id === saved.id ? saved : e))
        : [...list, saved],
    )
}

export function useSaveExercise(ownerId: string) {
  const upsert = useUpsertIntoCache()
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: ExerciseInput }) =>
      id ? updateExercise(id, input) : createExercise(ownerId, input),
    onSuccess: upsert,
  })
}

export function useSetExerciseArchived() {
  const upsert = useUpsertIntoCache()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setExerciseArchived(id, archived),
    onSuccess: upsert,
  })
}
