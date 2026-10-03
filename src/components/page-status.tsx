import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PageLoading() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <p className="font-medium">Something went wrong</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="self-start">
          Try again
        </Button>
      )}
    </div>
  )
}
