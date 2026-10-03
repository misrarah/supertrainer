// Where a signed-out visitor was heading, kept across the sign-in redirect (which may open in a
// new tab for magic links, hence localStorage).
const KEY = 'auth-return-to'

export function readReturnTo(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveReturnTo(path: string) {
  try {
    localStorage.setItem(KEY, path)
  } catch {
    // Storage unavailable (private mode); the user lands on their home page instead.
  }
}

export function clearReturnTo() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
