export const AUTH_STORAGE_KEY = "voltops-session"
export const AUTH_EVENT = "voltops-auth"
export const DEMO_EMAIL = "nina.v@example.com"
export const DEMO_PASSWORD = "demo123"
export const SESSION_HOURS = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AuthSession = {
  email: string
  signedInAt: number
}

export type LoginResult =
  | { ok: true }
  | { ok: false; field?: "email" | "password" | "authorized"; message: string }

function notifyAuthChange() {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.email || !parsed.signedInAt) {
      return null
    }
    const expiresAt = parsed.signedInAt + SESSION_HOURS * 60 * 60 * 1000
    if (Date.now() > expiresAt) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function isAuthenticated() {
  return readSession() !== null
}

export function setAuthenticated(value: boolean, email = DEMO_EMAIL) {
  if (value) {
    const session: AuthSession = {
      email,
      signedInAt: Date.now(),
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    notifyAuthChange()
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  notifyAuthChange()
}

export function signIn(email: string, password: string): LoginResult {
  const trimmedEmail = email.trim().toLowerCase()

  if (!trimmedEmail) {
    return { ok: false, field: "email", message: "Work email is required." }
  }
  if (!isValidEmail(trimmedEmail)) {
    return { ok: false, field: "email", message: "Enter a valid email address." }
  }
  if (trimmedEmail !== DEMO_EMAIL) {
    return { ok: false, field: "email", message: "This email is not provisioned for VoltOps." }
  }
  if (!password) {
    return { ok: false, field: "password", message: "Password is required." }
  }
  if (password.length < 6) {
    return { ok: false, field: "password", message: "Password must be at least 6 characters." }
  }
  if (password !== DEMO_PASSWORD) {
    return { ok: false, field: "password", message: "Incorrect password." }
  }

  setAuthenticated(true, trimmedEmail)
  return { ok: true }
}
