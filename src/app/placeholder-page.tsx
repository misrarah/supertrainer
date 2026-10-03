import { Button } from '@/components/ui/button'

export function PlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Supertrainer</h1>
      <p className="text-muted-foreground">
        Plans from your trainer, logged set by set. The pilot is on its way.
      </p>
      <Button size="lg" disabled>
        Sign in (coming soon)
      </Button>
    </main>
  )
}
