import { describe, expect, it } from 'vitest'
import { exerciseTokens, findSimilarExercises } from './exercise-match'

const library = [
  'Dumbbell Bench Press',
  'Barbell Bench Press',
  'Push-up',
  'Knee Push-up',
  'Romanian Deadlift',
  'Conventional Deadlift',
  'Goblet Squat',
  'Lat Pulldown',
  'Band Lat Pulldown',
  'Pull-up',
  'Chin-up',
  'Kettlebell Swing',
  'Overhead Press',
  'Triceps Pushdown',
  'Dumbbell Fly',
  'Plank',
].map((name) => ({ name, archived: false }))

const top = (query: string) => findSimilarExercises(query, library)[0]?.exercise.name
const names = (query: string) => findSimilarExercises(query, library).map((m) => m.exercise.name)

describe('exerciseTokens', () => {
  it('unifies shorthand, spellings and plurals', () => {
    expect(exerciseTokens('DB Bench')).toEqual(['dumbbell', 'bench'])
    expect(exerciseTokens('Press-ups')).toEqual(['push', 'up'])
    expect(exerciseTokens('RDLs')).toEqual(['romanian', 'deadlift'])
    expect(exerciseTokens('Goblet squats')).toEqual(['goblet', 'squat'])
    expect(exerciseTokens('Lat pull downs')).toEqual(['lat', 'pulldown'])
    expect(exerciseTokens('tricep push-downs')).toEqual(['triceps', 'pushdown'])
  })
})

describe('findSimilarExercises', () => {
  it('finds exercises written in gym shorthand', () => {
    expect(top('db bench')).toBe('Dumbbell Bench Press')
    expect(top('press ups')).toBe('Push-up')
    expect(top('RDL')).toBe('Romanian Deadlift')
    expect(top('OHP')).toBe('Overhead Press')
    expect(top('KB swings')).toBe('Kettlebell Swing')
    expect(top('dumbell flyes')).toBe('Dumbbell Fly')
  })

  it('finds exercises with spacing and plural differences', () => {
    expect(top('lat pull downs')).toBe('Lat Pulldown')
    expect(top('pullups')).toBe('Pull-up')
    expect(top('chinups')).toBe('Chin-up')
  })

  it('tolerates small typos', () => {
    expect(top('goblit squat')).toBe('Goblet Squat')
    expect(top('romainian deadlift')).toBe('Romanian Deadlift')
  })

  it('suggests the base exercise for a variation name', () => {
    expect(names('Tempo Goblet Squat')).toContain('Goblet Squat')
    expect(names('Paused Barbell Bench Press')[0]).toBe('Barbell Bench Press')
  })

  it('puts an exact match first and flags it', () => {
    const [first] = findSimilarExercises('push ups', library)
    expect(first?.exercise.name).toBe('Push-up')
    expect(first?.exact).toBe(true)
  })

  it('returns nothing for unrelated or very short names', () => {
    expect(names('Sled drag')).toEqual([])
    expect(names('ab')).toEqual([])
  })

  it('ignores archived exercises', () => {
    expect(findSimilarExercises('plank', [{ name: 'Plank', archived: true }])).toEqual([])
  })

  it('drops weak matches when there is a strong one', () => {
    expect(names('db bench')).toEqual(['Dumbbell Bench Press'])
  })

  it('keeps several matches when they are equally good', () => {
    expect(
      findSimilarExercises('curl', [
        { name: 'Dumbbell Curl', archived: false },
        { name: 'Cable Curl', archived: false },
        { name: 'Hammer Curl', archived: false },
      ]),
    ).toHaveLength(3)
  })

  it('limits the number of suggestions', () => {
    expect(findSimilarExercises('press', library, { limit: 2, threshold: 0 })).toHaveLength(2)
  })
})
