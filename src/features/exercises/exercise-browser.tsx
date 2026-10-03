import { SlidersHorizontalIcon, StarIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Exercise } from '@/data/exercises'
import {
  activeFilterCount,
  type ExerciseFilters,
  filterExercises,
  MOVEMENT_PATTERNS,
  type MovementPattern,
} from '@/domain/exercises'
import { ExerciseFiltersPanel } from './exercise-filters'
import { FavoriteButton } from './favorite-button'
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_LABELS, PATTERN_LABELS } from './labels'
import { useFavoriteExerciseIds } from './use-exercises'

type Props = {
  exercises: Exercise[]
  userId: string
  filters: ExerciseFilters
  onFiltersChange: (filters: ExerciseFilters) => void
  onSelect: (exercise: Exercise) => void
}

/** Search, filters and a list grouped by movement. Shared by the library and the plan builder. */
export function ExerciseBrowser({ exercises, userId, filters, onFiltersChange, onSelect }: Props) {
  const [showFilters, setShowFilters] = useState(false)
  const filtersId = useId()
  const favorites = useFavoriteExerciseIds()
  const visible = useMemo(
    () => filterExercises(exercises, filters, userId, favorites.data),
    [exercises, filters, userId, favorites.data],
  )
  const groups = useMemo(() => groupByPattern(visible), [visible])
  const filterCount = activeFilterCount(filters)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search exercises"
          aria-label="Search exercises"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="h-11"
        />
        <Button
          variant="outline"
          className="h-11 shrink-0"
          aria-expanded={showFilters}
          aria-controls={filtersId}
          onClick={() => setShowFilters((open) => !open)}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          Filters{filterCount > 0 && ` (${filterCount})`}
        </Button>
      </div>

      <Button
        variant="outline"
        className="h-10"
        aria-pressed={filters.favoritesOnly}
        onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
      >
        <StarIcon
          aria-hidden="true"
          className={filters.favoritesOnly ? 'fill-amber-400 text-amber-500' : undefined}
        />
        Favourites only
      </Button>

      <div id={filtersId} hidden={!showFilters}>
        <ExerciseFiltersPanel filters={filters} onChange={onFiltersChange} />
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {visible.length === 1 ? '1 exercise' : `${visible.length} exercises`}
      </p>

      {visible.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center">
          {filters.favoritesOnly && (favorites.data?.size ?? 0) === 0
            ? 'No favourites yet. Tap the star on an exercise to add it here.'
            : 'No exercises match. Try clearing some filters.'}
        </p>
      )}

      {groups.map(([pattern, items]) => (
        <section key={pattern ?? 'other'} aria-label={pattern ? PATTERN_LABELS[pattern] : 'Other'}>
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">
            {pattern ? PATTERN_LABELS[pattern] : 'Other'}
          </h2>
          <ul className="divide-y rounded-lg border">
            {items.map((exercise) => (
              <li key={exercise.id} className="flex items-center pr-1">
                <button
                  type="button"
                  onClick={() => onSelect(exercise)}
                  className="hover:bg-muted focus-visible:bg-muted flex min-h-14 min-w-0 flex-1 flex-col items-start gap-1 px-3 py-2.5 text-left focus-visible:outline-none"
                >
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {exercise.name}
                    {!exercise.is_builtin && (
                      <Badge variant="secondary">
                        {exercise.owner_id === userId ? 'Yours' : 'Custom'}
                      </Badge>
                    )}
                    {exercise.archived && <Badge variant="outline">Archived</Badge>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {[
                      exercise.primary_muscle && MUSCLE_LABELS[exercise.primary_muscle],
                      exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', '),
                      exercise.difficulty && DIFFICULTY_LABELS[exercise.difficulty],
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
                <FavoriteButton
                  exerciseId={exercise.id}
                  exerciseName={exercise.name}
                  userId={userId}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function groupByPattern(exercises: Exercise[]): [MovementPattern | null, Exercise[]][] {
  const groups = new Map<MovementPattern | null, Exercise[]>()
  for (const exercise of exercises) {
    const list = groups.get(exercise.movement_pattern) ?? []
    list.push(exercise)
    groups.set(exercise.movement_pattern, list)
  }
  // filterExercises already sorts by pattern; keep that order explicitly anyway.
  return [...groups.entries()].sort(
    ([a], [b]) =>
      (a ? MOVEMENT_PATTERNS.indexOf(a) : Infinity) - (b ? MOVEMENT_PATTERNS.indexOf(b) : Infinity),
  )
}
