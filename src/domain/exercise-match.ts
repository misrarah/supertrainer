// Finds existing exercises that look like what someone is about to create, so they can reuse or
// vary an existing one instead of making a near-duplicate.

/** Gym shorthand and common spellings, rewritten before comparing. Longest phrases first. */
const PHRASES: [RegExp, string][] = [
  [/\bpress ?ups?\b/g, 'push up'],
  [/\bpush ?ups?\b/g, 'push up'],
  [/\bpull ?ups?\b/g, 'pull up'],
  [/\bchin ?ups?\b/g, 'chin up'],
  [/\bsit ?ups?\b/g, 'sit up'],
  [/\bstep ?ups?\b/g, 'step up'],
  [/\bpull ?downs?\b/g, 'pulldown'],
  [/\bpush ?downs?\b/g, 'pushdown'],
  [/\bdead ?lifts?\b/g, 'deadlift'],
  [/\bskull ?crushers?\b/g, 'skull crusher'],
  [/\brdls?\b/g, 'romanian deadlift'],
  [/\bsldls?\b/g, 'romanian deadlift'],
  [/\bohp\b/g, 'overhead press'],
  [/\bshoulder press\b/g, 'shoulder press'],
]

const WORDS: Record<string, string> = {
  db: 'dumbbell',
  dbs: 'dumbbell',
  dumbell: 'dumbbell',
  dumbells: 'dumbbell',
  kb: 'kettlebell',
  kbs: 'kettlebell',
  bb: 'barbell',
  bw: 'bodyweight',
  ez: 'ez',
  tricep: 'triceps',
  bicep: 'biceps',
  abs: 'core',
  ab: 'core',
  flye: 'fly',
  flyes: 'fly',
  flies: 'fly',
}

// Words that say little about which exercise it is.
const STOP_WORDS = new Set(['the', 'a', 'an', 'with', 'on', 'of', 'and', 'to', 'exercise'])

function singular(word: string): string {
  if (word.length <= 3 || word.endsWith('ss') || word.endsWith('us')) return word
  if (word === 'triceps' || word === 'biceps') return word
  return word.endsWith('s') ? word.slice(0, -1) : word
}

/** Lower-case, unify shorthand, and split into meaningful words. */
export function exerciseTokens(name: string): string[] {
  let text = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')
  for (const [pattern, replacement] of PHRASES) text = text.replace(pattern, replacement)
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => WORDS[word] ?? word)
    .flatMap((word) => word.split(' '))
    .map(singular)
    .filter((word) => !STOP_WORDS.has(word))
}

function bigrams(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (let i = 0; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2)
    counts.set(pair, (counts.get(pair) ?? 0) + 1)
  }
  return counts
}

/** Sørensen–Dice similarity of character pairs, 0..1. Tolerates typos and joined words. */
function bigramSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0
  const pairsA = bigrams(a)
  const pairsB = bigrams(b)
  let shared = 0
  for (const [pair, count] of pairsA) shared += Math.min(count, pairsB.get(pair) ?? 0)
  return (2 * shared) / (a.length - 1 + (b.length - 1))
}

/** How alike two exercise names are, 0..1. */
export function nameSimilarity(query: string, candidate: string): number {
  const q = exerciseTokens(query)
  const c = exerciseTokens(candidate)
  if (q.length === 0 || c.length === 0) return 0

  const candidateWords = new Set(c)
  const shared = q.filter((word) => candidateWords.has(word)).length
  const wordScore = (2 * shared) / (q.length + c.length)
  // Every typed word appears in the candidate: "goblet squat" is in "tempo goblet squat".
  const containedScore = shared === q.length ? 0.6 + 0.4 * wordScore : 0
  const charScore = bigramSimilarity(q.join(''), c.join(''))

  return Math.max(wordScore, containedScore, charScore)
}

export type ExerciseMatch<T> = { exercise: T; score: number; exact: boolean }

/**
 * Existing exercises similar to `query`, best first. Ignores archived ones and queries shorter
 * than three characters. Keeps only matches close to the best one, so a strong match isn't
 * buried among names that merely share a long word like "dumbbell".
 */
export function findSimilarExercises<T extends { name: string; archived: boolean }>(
  query: string,
  exercises: readonly T[],
  { limit = 5, threshold = 0.5, spread = 0.25 } = {},
): ExerciseMatch<T>[] {
  if (query.trim().length < 3) return []
  const queryKey = exerciseTokens(query).join(' ')
  const matches = exercises
    .filter((exercise) => !exercise.archived)
    .map((exercise) => ({
      exercise,
      score: nameSimilarity(query, exercise.name),
      exact: exerciseTokens(exercise.name).join(' ') === queryKey,
    }))
    .filter((match) => match.score >= threshold)
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score)
  const best = Math.max(0, ...matches.map((match) => match.score))
  return matches.filter((match) => match.score >= best - spread).slice(0, limit)
}
