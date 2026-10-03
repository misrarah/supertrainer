import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  EMPTY_FILTERS,
  type FilterableExercise,
  filterExercises,
} from './exercises'

const ME = 'me'

function exercise(overrides: Partial<FilterableExercise> & { name: string }): FilterableExercise {
  return {
    id: overrides.name,
    description: null,
    owner_id: null,
    is_builtin: true,
    archived: false,
    movement_pattern: 'squat',
    primary_muscle: 'quads',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    ...overrides,
  }
}

const library = [
  exercise({ name: 'Barbell Back Squat', equipment: ['barbell'], difficulty: 'intermediate' }),
  exercise({ name: 'Sit-to-Stand' }),
  exercise({ name: 'Goblet Squat', equipment: ['dumbbell', 'kettlebell'] }),
  exercise({ name: 'Push-up', movement_pattern: 'push_horizontal', primary_muscle: 'chest' }),
  exercise({
    name: 'Band Row',
    movement_pattern: 'pull_horizontal',
    primary_muscle: 'back',
    equipment: ['band'],
  }),
  exercise({ name: 'My Squat', is_builtin: false, owner_id: ME }),
  exercise({ name: 'Old Squat', is_builtin: false, owner_id: ME, archived: true }),
  exercise({ name: 'Trainer Squat', is_builtin: false, owner_id: 'trainer' }),
]

const names = (list: FilterableExercise[]) => list.map((e) => e.name)

describe('filterExercises', () => {
  it('hides archived exercises and sorts by pattern, difficulty, least kit, then name', () => {
    expect(names(filterExercises(library, EMPTY_FILTERS, ME))).toEqual([
      'My Squat',
      'Sit-to-Stand',
      'Trainer Squat',
      'Goblet Squat',
      'Barbell Back Squat',
      'Push-up',
      'Band Row',
    ])
  })

  it('shows archived exercises when asked', () => {
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, showArchived: true }, ME))).toContain(
      'Old Squat',
    )
  })

  it('searches every word, ignoring case and punctuation', () => {
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, search: 'sit stand' }, ME))).toEqual([
      'Sit-to-Stand',
    ])
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, search: 'PUSHUP' }, ME))).toEqual([])
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, search: 'push-up' }, ME))).toEqual([
      'Push-up',
    ])
  })

  it('searches the primary muscle too', () => {
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, search: 'chest' }, ME))).toEqual([
      'Push-up',
    ])
  })

  it('filters by movement pattern and muscle', () => {
    expect(
      names(filterExercises(library, { ...EMPTY_FILTERS, pattern: 'pull_horizontal' }, ME)),
    ).toEqual(['Band Row'])
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, muscle: 'chest' }, ME))).toEqual([
      'Push-up',
    ])
  })

  it('matches exercises that use any of the chosen equipment', () => {
    expect(
      names(filterExercises(library, { ...EMPTY_FILTERS, equipment: ['kettlebell', 'band'] }, ME)),
    ).toEqual(['Goblet Squat', 'Band Row'])
  })

  it('ranks an exercise by its most accessible equipment option', () => {
    const list = [
      exercise({ name: 'A Machine Move', equipment: ['machine'] }),
      exercise({ name: 'B Band or Cable', equipment: ['cable', 'band'] }),
      exercise({ name: 'C Bodyweight', equipment: ['bodyweight'] }),
    ]
    expect(names(filterExercises(list, EMPTY_FILTERS, ME))).toEqual([
      'C Bodyweight',
      'B Band or Cable',
      'A Machine Move',
    ])
  })

  it('filters by difficulty', () => {
    expect(
      names(filterExercises(library, { ...EMPTY_FILTERS, difficulties: ['intermediate'] }, ME)),
    ).toEqual(['Barbell Back Squat'])
  })

  it('filters by source', () => {
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, source: 'mine' }, ME))).toEqual([
      'My Squat',
    ])
    expect(names(filterExercises(library, { ...EMPTY_FILTERS, source: 'others' }, ME))).toEqual([
      'Trainer Squat',
    ])
    expect(filterExercises(library, { ...EMPTY_FILTERS, source: 'builtin' }, ME)).toHaveLength(5)
  })
})

describe('favourites', () => {
  it('shows only favourites when asked', () => {
    const favorites = new Set(['Push-up', 'Old Squat'])
    expect(
      names(filterExercises(library, { ...EMPTY_FILTERS, favoritesOnly: true }, ME, favorites)),
    ).toEqual(['Push-up'])
  })

  it('ignores favourites when the toggle is off', () => {
    expect(filterExercises(library, EMPTY_FILTERS, ME, new Set(['Push-up']))).toHaveLength(7)
  })
})

describe('activeFilterCount', () => {
  it('counts filters other than search', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
    expect(
      activeFilterCount({
        ...EMPTY_FILTERS,
        search: 'x',
        equipment: ['band', 'dumbbell'],
        muscle: 'back',
      }),
    ).toBe(2)
  })
})
