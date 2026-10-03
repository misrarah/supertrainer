import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUserId } from '@/app/auth-context'
import { UnitsToggle } from '@/components/units-toggle'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { deleteAccount, signOut } from '@/data/auth'
import { errorMessage } from '@/data/errors'
import { type Profile, updateMyProfile } from '@/data/profiles'
import { profileQueryKey, useMyProfile } from '@/features/auth/use-my-profile'

const schema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name').max(50, 'Keep it under 50 characters'),
  units: z.enum(['kg', 'lb']),
})
type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const profile = useMyProfile()
  // The route guard only renders this page once the profile has loaded.
  if (!profile.data) return null
  return <Settings profile={profile.data} />
}

function Settings({ profile }: { profile: Profile }) {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: profile.display_name ?? '', units: profile.units },
  })

  const save = useMutation({
    mutationFn: (values: FormValues) => updateMyProfile(userId, values),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueryKey(userId), updated)
      form.reset({ display_name: updated.display_name ?? '', units: updated.units })
      toast.success('Settings saved')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const logout = useMutation({
    mutationFn: signOut,
    onError: (error) => toast.error(errorMessage(error)),
  })

  const { errors, isDirty } = form.formState

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <form noValidate className="space-y-5" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
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

        <p className="text-muted-foreground text-sm">
          Account type:{' '}
          <span className="text-foreground">
            {profile.role === 'trainer' ? 'Trainer' : 'Working out'}
          </span>
        </p>

        <Button type="submit" className="h-11" disabled={!isDirty || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <Separator />

      <div className="flex flex-col items-start gap-3">
        <Button
          variant="outline"
          className="h-11"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Sign out
        </Button>
        <Link to="/privacy" className="text-sm underline underline-offset-2">
          Privacy notice
        </Link>
      </div>

      <Separator />

      <DeleteAccount isTrainer={profile.role === 'trainer'} />
    </div>
  )
}

const CONFIRM_WORD = 'DELETE'

function DeleteAccount({ isTrainer }: { isTrainer: boolean }) {
  const [typed, setTyped] = useState('')
  const remove = useMutation({
    mutationFn: deleteAccount,
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <section className="space-y-3" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="font-medium">
        Delete account
      </h2>
      <p className="text-muted-foreground text-sm">
        Permanently deletes your account and your data.
        {isTrainer && ' Your clients keep copies of the plans you wrote for them.'}
      </p>
      <AlertDialog onOpenChange={(open) => !open && setTyped('')}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="h-11">
            Delete my account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This can’t be undone. Type {CONFIRM_WORD} to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label={`Type ${CONFIRM_WORD} to confirm`}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoCapitalize="characters"
            className="h-11"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={typed !== CONFIRM_WORD || remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? 'Deleting…' : 'Delete account'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
