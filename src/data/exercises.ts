import {
  CAUTION_TAGS,
  type CautionTag,
  DIFFICULTIES,
  type Difficulty,
  EQUIPMENT,
  type Equipment,
  MOVEMENT_PATTERNS,
  type MovementPattern,
  MUSCLES,
  type Muscle,
  TRACKING_TYPES,
  type TrackingType,
} from '@/domain/exercises'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { toAppError } from './errors'

type Row = Tables<'exercises'>

export type Exercise = Omit<
  Row,
  | 'movement_pattern'
  | 'primary_muscle'
  | 'secondary_muscles'
  | 'equipment'
  | 'tracking_type'
  | 'difficulty'
  | 'caution_tags'
> & {
  movement_pattern: MovementPattern | null
  primary_muscle: Muscle | null
  secondary_muscles: Muscle[]
  equipment: Equipment[]
  tracking_type: TrackingType
  difficulty: Difficulty | null
  caution_tags: CautionTag[]
}

/** The fields a user can set on their own exercise. */
export type ExerciseInput = Pick<
  Exercise,
  | 'name'
  | 'description'
  | 'movement_pattern'
  | 'primary_muscle'
  | 'secondary_muscles'
  | 'equipment'
  | 'tracking_type'
  | 'difficulty'
  | 'caution_tags'
  | 'video_url'
  | 'variation_of'
>

const oneOf = <T extends string>(allowed: readonly T[], value: string | null): T | null =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null

const someOf = <T extends string>(allowed: readonly T[], values: string[] | null): T[] =>
  (values ?? []).filter((value): value is T => (allowed as readonly string[]).includes(value))

// The database's check constraints guarantee these values; this narrows the generated `string` types.
function toExercise(row: Row): Exercise {
  return {
    ...row,
    movement_pattern: oneOf(MOVEMENT_PATTERNS, row.movement_pattern),
    primary_muscle: oneOf(MUSCLES, row.primary_muscle),
    secondary_muscles: someOf(MUSCLES, row.secondary_muscles),
    equipment: someOf(EQUIPMENT, row.equipment),
    tracking_type: oneOf(TRACKING_TYPES, row.tracking_type) ?? 'reps_only',
    difficulty: oneOf(DIFFICULTIES, row.difficulty),
    caution_tags: someOf(CAUTION_TAGS, row.caution_tags),
  }
}

/** Every exercise the signed-in user can see, including archived ones (filter them in the UI). */
export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name')
  if (error) throw toAppError(error)
  return data.map(toExercise)
}

export async function createExercise(ownerId: string, input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...input, owner_id: ownerId })
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return toExercise(data)
}

export async function updateExercise(id: string, input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return toExercise(data)
}

/** Exercises are archived rather than deleted, because plans and history refer to them. */
export async function setExerciseArchived(id: string, archived: boolean): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update({ archived })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return toExercise(data)
}
