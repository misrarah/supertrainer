import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** A native select: the most usable picker on phones. */
export function SelectField({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3',
        className,
      )}
      {...props}
    />
  )
}
