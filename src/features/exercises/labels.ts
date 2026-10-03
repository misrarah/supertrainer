import type {
  CautionTag,
  Difficulty,
  Equipment,
  MovementPattern,
  Muscle,
  TrackingType,
} from '@/domain/exercises'

export const PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Squat',
  lunge: 'Lunge and single leg',
  hinge: 'Hinge and bridge',
  push_horizontal: 'Push (chest)',
  push_vertical: 'Push (overhead)',
  pull_horizontal: 'Pull (row)',
  pull_vertical: 'Pull (pull-down)',
  carry: 'Carry',
  core: 'Core',
  isolation: 'Arms, legs and isolation',
  cardio: 'Cardio',
}

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  full_body: 'Full body',
  cardio: 'Cardio',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Bodyweight',
  band: 'Bands',
  dumbbell: 'Dumbbells',
  kettlebell: 'Kettlebells',
  pull_up_bar: 'Pull-up bar',
  bench: 'Bench or step',
  barbell: 'Barbell',
  cable: 'Cable',
  machine: 'Machine',
  cardio_machine: 'Cardio machine',
  other: 'Other',
}

export const TRACKING_LABELS: Record<TrackingType, string> = {
  weight_reps: 'Weight and reps',
  bodyweight_reps: 'Reps (bodyweight, optional added weight)',
  assisted_reps: 'Reps with assistance weight',
  reps_only: 'Reps only',
  duration: 'Time',
  distance_duration: 'Distance and time',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const CAUTION_LABELS: Record<CautionTag, string> = {
  knees: 'Knees',
  lower_back: 'Lower back',
  shoulders: 'Shoulders',
  hips: 'Hips',
  wrists: 'Wrists',
  neck: 'Neck',
}
