import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { sendMagicLink, signInWithGoogle, takeAuthErrorFromUrl } from '@/data/auth'
import { errorMessage } from '@/data/errors'

const emailSchema = z.object({ email: z.email('Enter a valid email address') })
type EmailForm = z.infer<typeof emailSchema>

export function LoginPage() {
  const [urlError] = useState(takeAuthErrorFromUrl)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const google = useMutation({ mutationFn: signInWithGoogle })
  const magicLink = useMutation({
    mutationFn: (email: string) => sendMagicLink(email),
    onSuccess: (_data, email) => setSentTo(email),
  })

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const error = google.error ?? magicLink.error

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Supertrainer</h1>
        <p className="text-muted-foreground">Sign in to see your plan and log your workouts.</p>
      </div>

      {(urlError || error) && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {urlError ? `Sign-in didn’t work: ${urlError}` : errorMessage(error)}
        </p>
      )}

      <Button
        size="lg"
        className="h-12 text-base"
        onClick={() => google.mutate()}
        disabled={google.isPending}
      >
        {google.isPending ? 'Opening Google…' : 'Continue with Google'}
      </Button>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <Separator className="flex-1" />
        or
        <Separator className="flex-1" />
      </div>

      {sentTo ? (
        <div role="status" className="space-y-3 rounded-lg border p-4">
          <p className="font-medium">Check your email</p>
          <p className="text-muted-foreground text-sm">
            We sent a sign-in link to <strong className="text-foreground">{sentTo}</strong>. Open it
            on this device, in this browser.
          </p>
          <Button variant="outline" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-3"
          onSubmit={form.handleSubmit(({ email }) => magicLink.mutate(email))}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email me a sign-in link</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className="h-11"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full"
            disabled={magicLink.isPending}
          >
            {magicLink.isPending ? 'Sending…' : 'Send link'}
          </Button>
        </form>
      )}

      <p className="text-muted-foreground text-center text-xs">
        By signing in you agree to how we handle your data, described in our{' '}
        <Link to="/privacy" className="underline underline-offset-2">
          privacy notice
        </Link>
        .
      </p>
    </main>
  )
}
