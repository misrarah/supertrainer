import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ChipGroup } from '@/components/chip-group'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Exercise, ExerciseInput } from '@/data/exercises'
import { errorMessage } from '@/data/errors'
import {
  CAUTION_TAGS,
  DIFFICULTIES,
  EQUIPMENT,
  MOVEMENT_PATTERNS,
  MUSCLES,
  TRACKING_TYPES,
} from '@/domain/exercises'
import {
  CAUTION_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  PATTERN_LABELS,
  TRACKING_LABELS,
} from './labels'
import { ExerciseNameStep } from './exercise-name-step'
import { useExercises, useSaveExercise } from './use-exercises'

const optional = <T extends [string, ...string[]]>(values: T) =>
  z.union([z.enum(values), z.literal('')]).transform((v) => (v === '' ? null : v))

const schema = z.object({
  name: z.string().trim().min(1, 'Give the exercise a name').max(80, 'Keep it under 80 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Keep it under 1000 characters')
    .transform((v) => v || null),
  movement_pattern: optional([...MOVEMENT_PATTERNS]),
  primary_muscle: optional([...MUSCLES]),
  secondary_muscles: z.array(z.enum(MUSCLES)),
  equipment: z.array(z.enum(EQUIPMENT)).min(1, 'Choose at least one'),
  tracking_type: z.enum(TRACKING_TYPES),
  difficulty: optional([...DIFFICULTIES]),
  caution_tags: z.array(z.enum(CAUTION_TAGS)),
  video_url: z
    .union([
      z.url({ protocol: /^https?$/, error: 'Enter a full link starting with https://' }),
      z.literal(''),
    ])
    .transform((v) => v || null),
  variation_of: z.string().nullable(),
})
type FormInput = z.input<typeof schema>

const EMPTY: FormInput = {
  name: '',
  description: '',
  movement_pattern: '',
  primary_muscle: '',
  secondary_muscles: [],
  equipment: [],
  tracking_type: 'weight_reps',
  difficulty: '',
  caution_tags: [],
  video_url: '',
  variation_of: null,
}

function toFormInput(exercise: Exercise): FormInput {
  return {
    name: exercise.name,
    description: exercise.description ?? '',
    movement_pattern: exercise.movement_pattern ?? '',
    primary_muscle: exercise.primary_muscle ?? '',
    secondary_muscles: exercise.secondary_muscles,
    equipment: exercise.equipment,
    tracking_type: exercise.tracking_type,
    difficulty: exercise.difficulty ?? '',
    caution_tags: exercise.caution_tags,
    video_url: exercise.video_url ?? '',
    variation_of: exercise.variation_of,
  }
}

/** A variation starts as a copy of its parent's details, under a new name. */
function variationInput(parent: Exercise, name: string): FormInput {
  return { ...toFormInput(parent), name, video_url: '', variation_of: parent.id }
}

export type ExerciseFormTarget =
  { mode: 'new' } | { mode: 'variation'; parent: Exercise } | { mode: 'edit'; exercise: Exercise }

type Props = {
  /** null when closed. */
  target: ExerciseFormTarget | null
  userId: string
  onClose: () => void
  onSaved?: (exercise: Exercise) => void
}

export function ExerciseFormSheet({ target, userId, onClose, onSaved }: Props) {
  const save = useSaveExercise(userId)
  const exercises = useExercises()
  const form = useForm<FormInput, unknown, ExerciseInput>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })
  // New exercises start by looking for an existing match.
  const [step, setStep] = useState<'name' | 'details'>('details')
  const [draftName, setDraftName] = useState('')
  const [openedFor, setOpenedFor] = useState(target)

  // Start afresh each time the sheet opens for a new target.
  if (target !== openedFor) {
    setOpenedFor(target)
    setDraftName('')
    setStep(target?.mode === 'new' ? 'name' : 'details')
  }

  useEffect(() => {
    if (!target) return
    if (target.mode === 'new') form.reset(EMPTY)
    if (target.mode === 'variation') form.reset(variationInput(target.parent, ''))
    if (target.mode === 'edit') form.reset(toFormInput(target.exercise))
  }, [target, form])

  const isEdit = target?.mode === 'edit'
  const variationOf = useWatch({ control: form.control, name: 'variation_of' })
  const parent = variationOf ? exercises.data?.find((e) => e.id === variationOf) : undefined

  const submit = form.handleSubmit((input) =>
    save.mutate(
      { id: target?.mode === 'edit' ? target.exercise.id : null, input },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? 'Exercise saved' : 'Exercise created')
          onSaved?.(saved)
          onClose()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    ),
  )

  const { errors } = form.formState
  const fieldError = (name: keyof FormInput) =>
    errors[name] && (
      <p id={`${name}-error`} className="text-destructive text-sm">
        {errors[name]?.message}
      </p>
    )
  const invalid = (name: keyof FormInput) =>
    errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` } : {}

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Edit exercise' : variationOf ? 'New variation' : 'New exercise'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Changes apply everywhere this exercise is used.'
              : 'Your own exercises are visible to you and, if you’re a trainer, your clients.'}
          </SheetDescription>
        </SheetHeader>

        {step === 'name' && (
          <ExerciseNameStep
            name={draftName}
            onNameChange={setDraftName}
            exercises={exercises.data ?? []}
            userId={userId}
            onCreateNew={() => {
              form.reset({ ...EMPTY, name: draftName.trim() })
              setStep('details')
            }}
            onCreateVariation={(chosen) => {
              const name = draftName.trim() === chosen.name ? '' : draftName.trim()
              form.reset(variationInput(chosen, name))
              setStep('details')
            }}
          />
        )}

        <form
          id="exercise-form"
          noValidate
          onSubmit={submit}
          hidden={step !== 'details'}
          className="space-y-5 px-4"
        >
          {variationOf && (
            <div className="bg-muted flex items-center justify-between gap-3 rounded-lg p-3 text-sm">
              <span>
                Variation of <strong>{parent?.name ?? 'another exercise'}</strong>
              </span>
              <Button
                type="button"
                variant="ghost"
                className="h-9"
                onClick={() => form.setValue('variation_of', null, { shouldDirty: true })}
              >
                Unlink
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder={parent ? `e.g. Paused ${parent.name}` : undefined}
              className="h-11"
              {...invalid('name')}
              {...form.register('name')}
            />
            {fieldError('name')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">How to do it (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              {...invalid('description')}
              {...form.register('description')}
            />
            {fieldError('description')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement_pattern">Movement</Label>
              <SelectField id="movement_pattern" {...form.register('movement_pattern')}>
                <option value="">Not set</option>
                {MOVEMENT_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {PATTERN_LABELS[p]}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_muscle">Main muscle</Label>
              <SelectField id="primary_muscle" {...form.register('primary_muscle')}>
                <option value="">Not set</option>
                {MUSCLES.map((m) => (
                  <option key={m} value={m}>
                    {MUSCLE_LABELS[m]}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="space-y-2">
            <Label id="equipment-label">Equipment</Label>
            <Controller
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <ChipGroup
                  aria-labelledby="equipment-label"
                  options={EQUIPMENT}
                  labels={EQUIPMENT_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {fieldError('equipment')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tracking_type">Log it as</Label>
              <SelectField id="tracking_type" {...form.register('tracking_type')}>
                {TRACKING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TRACKING_LABELS[t]}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <SelectField id="difficulty" {...form.register('difficulty')}>
                <option value="">Not set</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="space-y-2">
            <Label id="secondary-label">Also works (optional)</Label>
            <Controller
              control={form.control}
              name="secondary_muscles"
              render={({ field }) => (
                <ChipGroup
                  aria-labelledby="secondary-label"
                  options={MUSCLES}
                  labels={MUSCLE_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label id="caution-label">Take care with (optional)</Label>
            <p className="text-muted-foreground text-xs">
              Clients who mention these areas in their questionnaire will see a warning.
            </p>
            <Controller
              control={form.control}
              name="caution_tags"
              render={({ field }) => (
                <ChipGroup
                  aria-labelledby="caution-label"
                  options={CAUTION_TAGS}
                  labels={CAUTION_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Demo video link (optional)</Label>
            <Input
              id="video_url"
              type="url"
              inputMode="url"
              placeholder="https://www.youtube.com/…"
              className="h-11"
              {...invalid('video_url')}
              {...form.register('video_url')}
            />
            {fieldError('video_url')}
          </div>
        </form>

        <SheetFooter className="flex-row gap-2" hidden={step !== 'details'}>
          <Button
            type="submit"
            form="exercise-form"
            className="h-11 flex-1"
            disabled={save.isPending}
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
