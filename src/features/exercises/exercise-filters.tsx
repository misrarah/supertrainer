import { ChipGroup } from '@/components/chip-group'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DIFFICULTIES,
  EMPTY_FILTERS,
  EQUIPMENT,
  type ExerciseFilters,
  type ExerciseSource,
  MOVEMENT_PATTERNS,
  type MovementPattern,
  MUSCLES,
  type Muscle,
} from '@/domain/exercises'
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_LABELS, PATTERN_LABELS } from './labels'

const SOURCE_LABELS: Record<ExerciseSource, string> = {
  all: 'All exercises',
  builtin: 'Built-in only',
  mine: 'Created by me',
  others: 'Created by others',
}

type Props = {
  filters: ExerciseFilters
  onChange: (filters: ExerciseFilters) => void
}

export function ExerciseFiltersPanel({ filters, onChange }: Props) {
  const set = (patch: Partial<ExerciseFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-pattern">Movement</Label>
          <SelectField
            id="filter-pattern"
            value={filters.pattern ?? ''}
            onChange={(e) => set({ pattern: (e.target.value || null) as MovementPattern | null })}
          >
            <option value="">Any movement</option>
            {MOVEMENT_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-muscle">Main muscle</Label>
          <SelectField
            id="filter-muscle"
            value={filters.muscle ?? ''}
            onChange={(e) => set({ muscle: (e.target.value || null) as Muscle | null })}
          >
            <option value="">Any muscle</option>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>
                {MUSCLE_LABELS[m]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="space-y-2">
        <Label id="filter-equipment-label">Equipment</Label>
        <ChipGroup
          aria-labelledby="filter-equipment-label"
          options={EQUIPMENT}
          labels={EQUIPMENT_LABELS}
          value={filters.equipment}
          onChange={(equipment) => set({ equipment })}
        />
      </div>

      <div className="space-y-2">
        <Label id="filter-difficulty-label">Difficulty</Label>
        <ChipGroup
          aria-labelledby="filter-difficulty-label"
          options={DIFFICULTIES}
          labels={DIFFICULTY_LABELS}
          value={filters.difficulties}
          onChange={(difficulties) => set({ difficulties })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="filter-source">Show</Label>
          <SelectField
            id="filter-source"
            value={filters.source}
            onChange={(e) => set({ source: e.target.value as ExerciseSource })}
          >
            {(Object.keys(SOURCE_LABELS) as ExerciseSource[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex h-11 items-center gap-3">
          <Switch
            id="filter-archived"
            checked={filters.showArchived}
            onCheckedChange={(showArchived) => set({ showArchived })}
          />
          <Label htmlFor="filter-archived">Show archived</Label>
        </div>
      </div>

      <Button
        variant="ghost"
        className="h-10"
        onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
      >
        Clear filters
      </Button>
    </div>
  )
}
