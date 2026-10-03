import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useUserId } from '@/app/auth-context'
import { UnitsToggle } from '@/components/units-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { errorMessage } from '@/data/errors'
import { completeOnboarding } from '@/data/profiles'
import { profileQueryKey, useMyProfile } from '@/features/auth/use-my-profile'

const schema = z.object({
  role: z.enum(['trainer', 'user'], { error: 'Choose one' }),
  display_name: z.string().trim().min(1, 'Enter your name').max(50, 'Keep it under 50 characters'),
  units: z.enum(['kg', 'lb']),
})
type FormValues = z.infer<typeof schema>

const ROLES = [
  {
    value: 'user',
    title: 'I’m working out',
    body: 'Follow a plan from your trainer, or build your own.',
  },
  {
    value: 'trainer',
    title: 'I’m a trainer',
    body: 'Invite clients, build their plans, and track progress.',
  },
] as const

export function OnboardingPage() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const profile = useMyProfile()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: profile.data?.display_name ?? '', units: 'kg' },
  })

  const save = useMutation({
    mutationFn: (values: FormValues) => completeOnboarding(userId, values),
    // The route guard sees the new role and moves on to the right home page.
    onSuccess: (updated) => queryClient.setQueryData(profileQueryKey(userId), updated),
  })

  const { errors } = form.formState

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">A couple of things before you start.</p>
      </div>

      <form noValidate className="space-y-6" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">How will you use Supertrainer?</legend>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ''}
                onValueChange={field.onChange}
                aria-invalid={errors.role ? true : undefined}
                aria-describedby="role-hint"
                className="gap-3"
              >
                {ROLES.map((role) => (
                  <Label
                    key={role.value}
                    htmlFor={`role-${role.value}`}
                    className="has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                  >
                    <RadioGroupItem id={`role-${role.value}`} value={role.value} className="mt-1" />
                    <span className="space-y-1">
                      <span className="block font-medium">{role.title}</span>
                      <span className="text-muted-foreground block text-sm font-normal">
                        {role.body}
                      </span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
          <p id="role-hint" className="text-muted-foreground text-xs">
            This can’t be changed later.
          </p>
          {errors.role && <p className="text-destructive text-sm">{errors.role.message}</p>}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="display_name">Your name</Label>
          <Input
            id="display_name"
            autoComplete="name"
            className="h-11"
            aria-invalid={errors.display_name ? true : undefined}
            aria-describedby={errors.display_name ? 'display_name-error' : undefined}
            {...form.register('display_name')}
          />
          {errors.display_name && (
            <p id="display_name-error" className="text-destructive text-sm">
              {errors.display_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label id="units-label">Weights in</Label>
          <Controller
            control={form.control}
            name="units"
            render={({ field }) => (
              <UnitsToggle
                aria-labelledby="units-label"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {save.error && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(save.error)}
          </p>
        )}

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </main>
  )
}
