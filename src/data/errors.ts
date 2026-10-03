/** Friendly text for the snake_case codes our RPCs and triggers raise. */
const MESSAGES: Record<string, string> = {
  not_signed_in: 'Please sign in again.',
  not_onboarded: 'Finish setting up your account first.',
  role_locked: 'Your account type can’t be changed.',
  invite_not_found: 'That invite code doesn’t exist.',
  invite_used: 'That invite has already been used.',
  invite_expired: 'That invite has expired. Ask your trainer for a new one.',
  trainer_cannot_join: 'Trainer accounts can’t join another trainer.',
  already_has_trainer: 'You already have a trainer.',
  not_your_client: 'That person isn’t one of your clients.',
  plan_not_found: 'That plan doesn’t exist or isn’t yours.',
  template_cannot_be_active: 'Assign the plan to a client before making it active.',
  exercise_not_found: 'One of the exercises isn’t available.',
}

export class AppError extends Error {
  readonly code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function toAppError(error: { message: string; code?: string }): AppError {
  const friendly = MESSAGES[error.message]
  return friendly ? new AppError(friendly, error.message) : new AppError(error.message, error.code)
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
