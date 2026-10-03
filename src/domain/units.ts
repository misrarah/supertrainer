export type Units = 'kg' | 'lb'

export const KG_PER_LB = 0.45359237

/** Converts a stored kg value to the user's unit, rounded to the nearest 0.5 kg or 1 lb. */
export function toDisplayWeight(kg: number, units: Units): number {
  if (units === 'kg') return Math.round(kg * 2) / 2
  return Math.round(kg / KG_PER_LB)
}

/** Converts a value the user entered into kg for storage (2 decimal places, to fit numeric(6,2)). */
export function fromDisplayWeight(value: number, units: Units): number {
  const kg = units === 'kg' ? value : value * KG_PER_LB
  return Math.round(kg * 100) / 100
}

/** Step size for the weight stepper on the logging screen. */
export function weightStep(units: Units): number {
  return units === 'kg' ? 2.5 : 5
}
