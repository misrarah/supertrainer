import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Props<T extends string> = {
  options: readonly T[]
  labels: Record<T, string>
  value: T[]
  onChange: (value: T[]) => void
  'aria-labelledby'?: string
  id?: string
}

/** A wrapping row of toggle chips for picking several values. */
export function ChipGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
  ...rest
}: Props<T>) {
  return (
    <ToggleGroup
      id={rest.id}
      type="multiple"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => onChange(options.filter((option) => next.includes(option)))}
      aria-labelledby={rest['aria-labelledby']}
      className="flex w-full flex-wrap justify-start"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          // The base toggle marks "on" with both aria-pressed and data-state; override both.
          className="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 aria-pressed:hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-9 rounded-full px-3"
        >
          {labels[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
