import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Units } from '@/domain/units'

type Props = {
  id?: string
  value: Units
  onChange: (units: Units) => void
  'aria-labelledby'?: string
}

export function UnitsToggle({ id, value, onChange, ...rest }: Props) {
  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      value={value}
      // Radix sends '' when the active item is clicked again; keep the current value.
      onValueChange={(next) => (next === 'kg' || next === 'lb') && onChange(next)}
      aria-labelledby={rest['aria-labelledby']}
      className="w-full"
    >
      <ToggleGroupItem value="kg" className="h-11 flex-1">
        Kilograms (kg)
      </ToggleGroupItem>
      <ToggleGroupItem value="lb" className="h-11 flex-1">
        Pounds (lb)
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
