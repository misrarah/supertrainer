import type { Units } from '@/domain/units'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { toAppError } from './errors'

export type Role = 'trainer' | 'user'

export type Profile = Omit<Tables<'profiles'>, 'role' | 'units'> & {
  role: Role | null
  units: Units
}

export type TrainerSummary = Pick<Profile, 'id' | 'display_name' | 'avatar_url'>

function toProfile(row: Tables<'profiles'>): Profile {
  return {
    ...row,
    role: row.role === 'trainer' || row.role === 'user' ? row.role : null,
    units: row.units === 'lb' ? 'lb' : 'kg',
  }
}

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw toAppError(error)
  return toProfile(data)
}

export async function updateMyProfile(
  userId: string,
  patch: { display_name?: string; units?: Units },
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return toProfile(data)
}

/** Sets the role (once), display name and units. */
export async function completeOnboarding(
  userId: string,
  values: { role: Role; display_name: string; units: Units },
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .is('role', null)
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return toProfile(data)
}

export async function listTrainers(): Promise<TrainerSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('role', 'trainer')
    .order('display_name')
  if (error) throw toAppError(error)
  return data
}
