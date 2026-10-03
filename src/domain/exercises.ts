// Allowed values for exercise fields. They mirror the check constraints in the migrations.

export const MOVEMENT_PATTERNS = [
  'squat',
  'lunge',
  'hinge',
  'push_horizontal',
  'push_vertical',
  'pull_horizontal',
  'pull_vertical',
  'carry',
  'core',
  'isolation',
  'cardio',
] as const
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number]

export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'full_body',
  'cardio',
] as const
export type Muscle = (typeof MUSCLES)[number]

/** Ordered from least to most kit; the library lists easier setups first. */
export const EQUIPMENT = [
  'bodyweight',
  'band',
  'dumbbell',
  'kettlebell',
  'pull_up_bar',
  'bench',
  'barbell',
  'cable',
  'machine',
  'cardio_machine',
  'other',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const TRACKING_TYPES = [
  'weight_reps',
  'bodyweight_reps',
  'assisted_reps',
  'reps_only',
  'duration',
  'distance_duration',
] as const
export type TrackingType = (typeof TRACKING_TYPES)[number]

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const CAUTION_TAGS = ['knees', 'lower_back', 'shoulders', 'hips', 'wrists', 'neck'] as const
export type CautionTag = (typeof CAUTION_TAGS)[number]

/** The fields filtering needs; the data layer's Exercise type satisfies it. */
export type FilterableExercise = {
  id: string
  name: string
  description: string | null
  owner_id: string | null
  is_builtin: boolean
  archived: boolean
  movement_pattern: MovementPattern | null
  primary_muscle: Muscle | null
  equipment: Equipment[]
  difficulty: Difficulty | null
}

export type ExerciseSource = 'all' | 'builtin' | 'mine' | 'others'

export type ExerciseFilters = {
  search: string
  pattern: MovementPattern | null
  muscle: Muscle | null
  /** Show exercises that use at least one of these. Empty means any equipment. */
  equipment: Equipment[]
  /** Empty means any difficulty. */
  difficulties: Difficulty[]
  source: ExerciseSource
  showArchived: boolean
  favoritesOnly: boolean
}

export const EMPTY_FILTERS: ExerciseFilters = {
  search: '',
  pattern: null,
  muscle: null,
  equipment: [],
  difficulties: [],
  source: 'all',
  showArchived: false,
  favoritesOnly: false,
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 }

const normalise = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')

function matchesSearch(exercise: FilterableExercise, search: string): boolean {
  const words = normalise(search).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalise(`${exercise.name} ${exercise.primary_muscle ?? ''}`)
  return words.every((word) => haystack.includes(word))
}

function matchesSource(exercise: FilterableExercise, source: ExerciseSource, userId: string) {
  switch (source) {
    case 'all':
      return true
    case 'builtin':
      return exercise.is_builtin
    case 'mine':
      return exercise.owner_id === userId
    case 'others':
      return !exercise.is_builtin && exercise.owner_id !== userId
  }
}

/**
 * Filters and sorts exercises for the library and picker so each movement reads as a progression:
 * by movement pattern, then difficulty, then the least kit needed, then name. Archived exercises
 * are hidden unless asked for.
 */
export function filterExercises<T extends FilterableExercise>(
  exercises: readonly T[],
  filters: ExerciseFilters,
  userId: string,
  favoriteIds: ReadonlySet<string> = new Set(),
): T[] {
  return exercises
    .filter(
      (e) =>
        (filters.showArchived || !e.archived) &&
        (!filters.favoritesOnly || favoriteIds.has(e.id)) &&
        matchesSearch(e, filters.search) &&
        (!filters.pattern || e.movement_pattern === filters.pattern) &&
        (!filters.muscle || e.primary_muscle === filters.muscle) &&
        (filters.equipment.length === 0 ||
          e.equipment.some((item) => filters.equipment.includes(item))) &&
        (filters.difficulties.length === 0 ||
          (e.difficulty !== null && filters.difficulties.includes(e.difficulty))) &&
        matchesSource(e, filters.source, userId),
    )
    .sort(
      (a, b) =>
        patternRank(a.movement_pattern) - patternRank(b.movement_pattern) ||
        difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
        equipmentRank(a.equipment) - equipmentRank(b.equipment) ||
        a.name.localeCompare(b.name),
    )
}

const patternRank = (pattern: MovementPattern | null) =>
  pattern ? MOVEMENT_PATTERNS.indexOf(pattern) : MOVEMENT_PATTERNS.length
const difficultyRank = (difficulty: Difficulty | null) =>
  difficulty ? DIFFICULTY_ORDER[difficulty] : DIFFICULTIES.length
// An exercise that can be done with bodyweight or a band ranks by its most accessible option.
const equipmentRank = (equipment: readonly Equipment[]) =>
  Math.min(EQUIPMENT.length, ...equipment.map((item) => EQUIPMENT.indexOf(item)))

/** Filters set in the filter panel (search and the favourites toggle sit outside it). */
export function activeFilterCount(filters: ExerciseFilters): number {
  return (
    (filters.pattern ? 1 : 0) +
    (filters.muscle ? 1 : 0) +
    (filters.equipment.length > 0 ? 1 : 0) +
    (filters.difficulties.length > 0 ? 1 : 0) +
    (filters.source !== 'all' ? 1 : 0) +
    (filters.showArchived ? 1 : 0)
  )
}
