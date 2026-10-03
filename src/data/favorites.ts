import { supabase } from '@/lib/supabase'
import { toAppError } from './errors'

/** Ids of the signed-in user's favourite exercises. */
export async function listFavoriteExerciseIds(): Promise<string[]> {
  const { data, error } = await supabase.from('favorite_exercises').select('exercise_id')
  if (error) throw toAppError(error)
  return data.map((row) => row.exercise_id)
}

export async function addFavoriteExercise(userId: string, exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_exercises')
    .upsert({ user_id: userId, exercise_id: exerciseId }, { ignoreDuplicates: true })
  if (error) throw toAppError(error)
}

export async function removeFavoriteExercise(userId: string, exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_exercises')
    .delete()
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
  if (error) throw toAppError(error)
}
